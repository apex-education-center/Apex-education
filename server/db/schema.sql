-- Apex Education Center — Postgres schema
-- Run once against your database: psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instructors (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  email      TEXT NOT NULL,
  experience TEXT NOT NULL DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '',
  photo      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  instructor_id TEXT REFERENCES instructors(id) ON DELETE SET NULL,
  level        TEXT NOT NULL DEFAULT '',
  mode         TEXT NOT NULL DEFAULT 'Online',
  price        INTEGER NOT NULL DEFAULT 0,
  duration     TEXT NOT NULL DEFAULT '',
  image        TEXT NOT NULL DEFAULT '',
  short_desc   TEXT NOT NULL DEFAULT '',
  full_desc    TEXT NOT NULL DEFAULT '',
  syllabus     JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule (
  id            TEXT PRIMARY KEY,
  course_id     TEXT REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id TEXT REFERENCES instructors(id) ON DELETE SET NULL,
  day           TEXT NOT NULL,
  time_range    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  date       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL,
  date       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved   BOOLEAN NOT NULL DEFAULT false,
  hidden     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS faqs (
  id       TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id            TEXT PRIMARY KEY,
  student_name  TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL DEFAULT '',
  course_id     TEXT REFERENCES courses(id) ON DELETE SET NULL,
  notes         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | declined
  meeting_link  TEXT,
  meeting_event_id TEXT,
  meeting_time  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
