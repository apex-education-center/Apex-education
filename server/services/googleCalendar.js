const { google } = require("googleapis");
const pool = require("../db/pool");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google Calendar is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env.");
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // forces refresh_token to be reissued even on repeat authorization
    scope: SCOPES,
  });
}

/** Exchanges the one-time authorization code for tokens and stores the refresh token in the DB. */
async function handleOAuthCallback(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. This usually means the app was already authorized once before — " +
      "go to https://myaccount.google.com/permissions, remove Apex Education Center's access, then try authorizing again."
    );
  }
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ('googleRefreshToken', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(tokens.refresh_token)]
  );
  return true;
}

async function getStoredRefreshToken() {
  const result = await pool.query(`SELECT value FROM site_settings WHERE key = 'googleRefreshToken'`);
  return result.rows[0] ? result.rows[0].value : null;
}

async function isCalendarConnected() {
  const token = await getStoredRefreshToken();
  return Boolean(token);
}

async function getAuthenticatedClient() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("Google Calendar isn't connected yet. An admin needs to authorize it once from Dashboard → Settings.");
  }
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Creates a real Google Calendar event with a Google Meet link and emails
 * a calendar invite to every attendee automatically (Google handles that
 * part — we don't need to send it ourselves).
 */
async function createMeetingEvent({ summary, description, startTime, durationMinutes = 60, attendeeEmails = [] }) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all", // emails every attendee a real calendar invite
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: attendeeEmails.filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `apex-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink =
    response.data.hangoutLink ||
    response.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    meetLink,
    startTime: start.toISOString(),
  };
}

async function deleteMeetingEvent(eventId) {
  if (!eventId) return;
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "all" }).catch(() => {});
}

module.exports = {
  getAuthUrl,
  handleOAuthCallback,
  isCalendarConnected,
  createMeetingEvent,
  deleteMeetingEvent,
};
