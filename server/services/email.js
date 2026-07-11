const { Resend } = require("resend");

let client = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set — cannot send email.");
  }
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function escapeHtml(str = "") {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapEmail(title, bodyHtml) {
  return `
  <div style="background:#17383F;padding:40px 24px;font-family:Georgia,serif;color:#F5FAF9;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#0E2327;border-radius:16px;border:1px solid rgba(245,250,249,0.08);overflow:hidden;">
      <tr><td style="padding:32px 32px 8px 32px;">
        <p style="letter-spacing:3px;text-transform:uppercase;font-size:11px;color:#36ABA3;font-family:Arial,sans-serif;margin:0 0 8px 0;">Apex Education Center</p>
        <h1 style="font-size:22px;margin:0 0 22px 0;font-weight:400;">${title}</h1>
      </td></tr>
      <tr><td style="padding:0 32px 32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#F5FAF9;">${bodyHtml}</td></tr>
    </table>
  </div>`;
}

function row(label, value) {
  return `<tr><td style="padding:6px 0;color:rgba(245,250,249,0.55);width:120px;">${label}</td><td style="padding:6px 0;color:#F5FAF9;">${value}</td></tr>`;
}

/** Resend sandbox (onboarding@resend.dev) only delivers to the account owner's inbox. */
function isResendSandbox() {
  const from = (process.env.EMAIL_FROM || "onboarding@resend.dev").toLowerCase();
  return from.includes("resend.dev") || from.includes("onboarding@");
}

function resolveRecipient(intended) {
  if (!isResendSandbox()) return intended;

  const sandboxInbox = process.env.RESEND_TEST_RECIPIENT;
  if (!sandboxInbox) {
    console.warn(
      `[Resend sandbox] EMAIL_FROM uses resend.dev — outbound mail only delivers to your Resend account email. ` +
        `Set RESEND_TEST_RECIPIENT in .env (intended recipient was ${intended}).`
    );
    return intended;
  }

  if (sandboxInbox !== intended) {
    console.info(`[Resend sandbox] Delivering to ${sandboxInbox} (intended: ${intended})`);
  }
  return sandboxInbox;
}

async function send({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || "Apex Education Center <onboarding@resend.dev>";
  const actualTo = resolveRecipient(to);
  const sandboxNote = actualTo !== to ? ` [intended: ${to}]` : "";
  const { error } = await getClient().emails.send({
    from,
    to: actualTo,
    subject: subject + sandboxNote,
    html,
  });
  if (error) throw new Error(error.message || "Failed to send email.");
}

/** Sent to admin/instructor when a new registration comes in. */
async function sendNewRegistrationAlert({ to, studentName, studentEmail, studentPhone, courseTitle, notes }) {
  const html = wrapEmail(
    "New Registration",
    `<p>A new student has registered${courseTitle ? ` for <strong>${escapeHtml(courseTitle)}</strong>` : ""}.</p>
     <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:16px;">
       ${row("Student", escapeHtml(studentName))}
       ${row("Contact", `${escapeHtml(studentEmail)}${studentPhone ? " · " + escapeHtml(studentPhone) : ""}`)}
       ${row("Course", courseTitle ? escapeHtml(courseTitle) : "General inquiry")}
     </table>
     ${notes ? `<p style="margin-top:20px;color:rgba(245,250,249,0.55);text-transform:uppercase;font-size:12px;letter-spacing:1px;">Notes</p><p>${escapeHtml(notes)}</p>` : ""}
     <p style="margin-top:24px;font-size:13px;color:rgba(245,250,249,0.5);">Confirm or decline this from the Apex admin dashboard.</p>`
  );
  await send({ to, subject: `New registration: ${studentName}`, html });
}

/** Sent to the student once an admin confirms their session, including the real Meet link. */
async function sendConfirmationWithMeeting({ to, studentName, courseTitle, meetingTime, meetingLink }) {
  const html = wrapEmail(
    "Your session is confirmed",
    `<p>Hi ${escapeHtml(studentName)}, your session${courseTitle ? ` for <strong>${escapeHtml(courseTitle)}</strong>` : ""} is confirmed.</p>
     <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:16px;">
       ${row("Date & Time", escapeHtml(meetingTime))}
     </table>
     <p style="margin-top:24px;"><a href="${meetingLink}" style="display:inline-block;background:#36ABA3;color:#0E2327;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;">Join Google Meet</a></p>
     <p style="margin-top:20px;font-size:13px;color:rgba(245,250,249,0.5);">A calendar invite has also been sent to your email.</p>`
  );
  await send({ to, subject: `Confirmed: your Apex session`, html });
}

/** Sent to the student if their registration is declined. */
async function sendDeclineNotice({ to, studentName, courseTitle }) {
  const html = wrapEmail(
    "About your registration",
    `<p>Hi ${escapeHtml(studentName)}, unfortunately we're unable to confirm your registration${courseTitle ? ` for <strong>${escapeHtml(courseTitle)}</strong>` : ""} at this time.</p>
     <p style="margin-top:16px;">Please reach out to us directly so we can find another time that works.</p>`
  );
  await send({ to, subject: `Update on your Apex registration`, html });
}

/** Sent to admin when a contact form message comes in. */
async function sendContactAlert({ to, name, email, message, subject }) {
  const html = wrapEmail(
    "New Contact Message",
    `<table role="presentation" width="100%" style="border-collapse:collapse;">
       ${row("From", escapeHtml(name))}
       ${row("Email", escapeHtml(email))}
     </table>
     <p style="margin-top:20px;">${escapeHtml(message)}</p>`
  );
  await send({ to, subject: subject || `New contact message from ${name}`, html });
}

module.exports = { send, sendNewRegistrationAlert, sendConfirmationWithMeeting, sendDeclineNotice, sendContactAlert };
