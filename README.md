# Apex Education Center

A multi-page educational platform: HTML5/CSS3/vanilla JS frontend, backed by
a real Node/Express API — Postgres for data, Resend for real transactional
email, and Google Calendar for real Meet-link meeting scheduling.

**→ Start with [`server/README.md`](server/README.md)** — that's the full
setup guide (database, email, Google Calendar, running it, deploying it).
This file is just a map of the project.

## How it fits together

```
apex-vanilla/
├── index.html, about.html, courses.html, ...    ← the public site (12 pages)
├── admin.html, dashboard.html                     ← admin login + Command Center
│
├── css/                                            ← design system
├── js/
│   ├── storage.js       ← API client (talks to /api/*, replaces old localStorage version)
│   ├── components.js    ← shared header/footer, nav, scroll effects
│   ├── main.js           ← homepage + most page rendering
│   ├── courses.js        ← course catalog + course detail page
│   ├── feedback.js       ← testimonial submission + star rating
│   ├── validation.js     ← shared form validation
│   └── admin.js          ← full admin panel logic
│
├── assets/images/logo.png
├── data/sample-data.json  ← used once, by server/db/seed.js, to seed Postgres
│
└── server/                ← the real backend (see server/README.md)
    ├── server.js           ← Express app — serves the API *and* this whole folder
    ├── db/                  ← Postgres schema + connection pool + seed script
    ├── services/
    │   ├── email.js          ← Resend — real emails
    │   └── googleCalendar.js ← Google Calendar OAuth + real Meet event creation
    ├── routes/                ← one file per resource (courses, instructors, etc.)
    └── middleware/adminAuth.js ← signed-cookie admin session
```

## Running it

Everything — frontend and backend — runs from one place now:

```powershell
cd server
npm install
# ...configure .env, see server/README.md for exactly how...
npm run seed
npm start
```

Then open **http://localhost:4000**. There's no separate `npx serve`
step anymore — this server serves the whole site.

## What's real now

- **Database**: every course, instructor, testimonial, registration, etc.
  lives in Postgres — shared across every device and browser, not just
  the one that made the change.
- **Email**: registrations, confirmations, decline notices, and contact
  messages send real emails via Resend.
- **Google Calendar**: confirming a registration in the admin dashboard
  creates a real Calendar event with a working Google Meet link, invites
  the student and instructor, and emails the student the join link.
- **Admin auth**: the password is bcrypt-hashed server-side; the browser
  only ever holds a signed session cookie, never the password itself.

Full setup instructions — including the Google Cloud Console steps, which
are the fiddliest part — are in [`server/README.md`](server/README.md).
