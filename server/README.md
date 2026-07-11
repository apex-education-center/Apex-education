# Apex Server — Real Database, Email & Google Calendar Setup

This is the backend that makes everything real: a Postgres database instead
of `localStorage`, real emails via Resend, and real Google Calendar meetings
(with an actual Google Meet link) created when you confirm a registration.

It also serves the website itself — once this is running, you visit the
site through this server (not a separate `serve` command).

Follow these steps in order. Each one produces a value you'll paste into
`.env` at the end.

---

## Step 1 — Get a Postgres database

If you still have the Neon project called **Apex** from earlier, you can
reuse it — this will add new tables to it without touching anything else.

1. Go to **https://console.neon.tech** → your **Apex** project
2. Click **Connect** → make sure **Connection pooling is OFF** (same as
   before — pooled connections are unreliable for the kind of setup this
   does)
3. Copy the connection string. It should **not** contain `-pooler` in the
   hostname, and should **not** contain `&channel_binding=require` (remove
   that part if present — it caused connection issues last time)

You'll paste this into `.env` as `DATABASE_URL` in Step 5.

---

## Step 2 — Get a Resend API key

1. Go to **https://resend.com** and sign in (or sign up if you haven't)
2. **API Keys** → **Create API Key** → copy it (starts with `re_`)
3. For `EMAIL_FROM`: if you haven't verified your own domain in Resend yet,
   use `Apex Education Center <onboarding@resend.dev>` for now — it works,
   but only delivers to the email address on your Resend account. Set
   `RESEND_TEST_RECIPIENT` in `.env` to that same address (the server will
   redirect all outbound mail there while in sandbox mode). Verify a real
   domain in Resend (**Domains** tab) and switch `EMAIL_FROM` to
   `you@yourdomain.com` when you're ready to send to real students and
   `apex2025.edu@gmail.com`.

---

## Step 3 — Set up Google Calendar (the real Meet-link part)

This is a one-time setup in Google Cloud Console. It's several steps but
each one is quick.

### 3a. Create a Google Cloud project

1. Go to **https://console.cloud.google.com**
2. Top-left, click the project dropdown → **New Project**
3. Name it `Apex Education Center` → **Create**
4. Make sure it's selected in the project dropdown

### 3b. Enable the Calendar API

1. In the search bar at top, type **Google Calendar API** → open it
2. Click **Enable**

### 3c. Configure the consent screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in: App name = `Apex Education Center`, User support email = your
   email, Developer contact = your email → **Save and Continue**
4. Scopes: click **Add or Remove Scopes**, search for `calendar.events`,
   check the box for `.../auth/calendar.events` → **Update** → **Save and
   Continue**
5. Test users: click **Add Users**, add your own Gmail address (the one
   you want Apex to create meetings from) → **Save and Continue**

### 3d. Create OAuth credentials

1. Left sidebar → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Apex Server`
5. Under **Authorized redirect URIs**, click **Add URI** and enter exactly:
   ```
   http://localhost:4000/auth/google/callback
   ```
   (If you later deploy this online, add a second URI here for your real
   domain, e.g. `https://yourdomain.com/auth/google/callback` — see the
   Deployment section at the bottom.)
6. **Create**
7. A popup shows your **Client ID** and **Client Secret** — copy both.
   (You can also find them again anytime under Credentials.)

You now have `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for `.env`.

---

## Step 4 — Decide your admin credentials

Pick:
- `ADMIN_PASSWORD` — whatever you want to log into `/admin.html` with
- `ADMIN_SESSION_SECRET` — any long random string (mash the keyboard, 40+
  characters is fine)
- `ADMIN_NOTIFICATION_EMAIL` — where new registrations/contact messages
  without a specific instructor should notify (usually your own email)

---

## Step 5 — Configure `.env`

```powershell
cd server
copy .env.example .env
```

Open `.env` and fill in everything from Steps 1–4:

```
DATABASE_URL="postgresql://...your Neon string..."
RESEND_API_KEY="re_...your key..."
EMAIL_FROM="Apex Education Center <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL="you@example.com"
GOOGLE_CLIENT_ID="...from step 3d..."
GOOGLE_CLIENT_SECRET="...from step 3d..."
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"
ADMIN_PASSWORD="pick-something"
ADMIN_SESSION_SECRET="a-long-random-string"
PORT=4000
```

---

## Step 6 — Install, initialize the database, and run

```powershell
npm install
psql "%DATABASE_URL%" -f db/schema.sql
npm run seed
npm start
```

If `psql` isn't recognized in PowerShell, the Neon dashboard also has a
built-in **SQL Editor** (left sidebar in your project) — paste the contents
of `server/db/schema.sql` there and run it instead.

You should see:
```
Apex server running at http://localhost:4000
```

Open **http://localhost:4000** — that's the live site now, served by this
same server. Notice the URL: it's no longer `npx serve` on a separate port,
it's this server, on port 4000.

---

## Step 7 — Connect Google Calendar (one-time)

1. Go to `http://localhost:4000/admin.html`, log in
2. **Dashboard → Settings → Connect Google Calendar**
3. You'll go through Google's consent screen — since your app is in
   "Testing" mode (Step 3c), you'll see an "unverified app" warning. Click
   **Advanced** → **Go to Apex Education Center (unsafe)** — this is normal
   and expected for a personal project not yet submitted for Google's
   verification review, not an actual security problem here since it's
   your own app and your own Google account.
4. Approve the Calendar permission
5. You'll land back on the dashboard with a success message

From now on, confirming a registration creates a real Calendar event with
a Meet link and emails everyone involved automatically.

---

## Step 8 — Test the whole flow end-to-end

1. On the public site, submit a **Registration** for any course
2. Check `ADMIN_NOTIFICATION_EMAIL` (or the course's instructor email) —
   you should get a real email about the new registration
3. Log into `/admin.html` → **Registrations** → click the calendar icon
   next to your test registration
4. Pick a date/time → **Confirm & Create Meeting**
5. Check the student's email — they should receive a real confirmation
   email with a working Google Meet link, plus a separate calendar invite
   from Google itself
6. Check your own Google Calendar — the event should be there

If any step fails, the error message in the toast/modal is usually
specific enough to point at what's misconfigured (wrong DB string, missing
Resend key, Calendar not connected, etc.).

---

## Deploying this for real (so students can actually use it)

Right now this only works on your own computer. To make it a real live
website:

1. Push this project to GitHub
2. Deploy `server/` to **Render** (or Railway) as a Node web service —
   build command `npm install`, start command `npm start`
3. Set all the same `.env` variables in Render's dashboard, **except**
   change `GOOGLE_REDIRECT_URI` to your real domain, e.g.
   `https://apex-education.onrender.com/auth/google/callback`
4. Go back to Google Cloud Console → Credentials → your OAuth client →
   add that same URL to **Authorized redirect URIs** (keep the localhost
   one too, for local testing)
5. Run the schema + seed once against your production database (same
   commands as Step 6, just pointed at the production `DATABASE_URL`)
6. Re-connect Google Calendar once from the live `/admin.html` (Step 7),
   since the refresh token is tied to which redirect URI was used

## What's stored where

- **Postgres**: courses, instructors, schedule, testimonials, FAQs,
  announcements, registrations, contact messages, newsletter signups, site
  content, and the admin password (bcrypt-hashed, never stored in plain
  text)
- **Nowhere else**: there's no more `localStorage` data layer — every page
  now calls this API directly, so content is shared across every device
  and browser, not just the one that made the change
