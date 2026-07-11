/**
 * Seeds the database from ../../data/sample-data.json.
 * Safe to re-run: uses ON CONFLICT DO NOTHING, so it never duplicates or
 * overwrites content an admin has already edited.
 * Usage: node db/seed.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function seed() {
  const dataPath = path.join(__dirname, "..", "..", "data", "sample-data.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO site_settings (key, value) VALUES ('siteInfo', $1), ('stats', $2)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(data.siteInfo), JSON.stringify(data.stats)]
    );

    for (const c of data.categories) {
      await client.query(
        `INSERT INTO categories (id, name, icon) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.icon]
      );
    }

    for (const i of data.instructors) {
      await client.query(
        `INSERT INTO instructors (id, name, subject, email, experience, bio, photo)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [i.id, i.name, i.subject, i.email, i.experience, i.bio, i.photo || ""]
      );
    }

    for (const c of data.courses) {
      await client.query(
        `INSERT INTO courses (id, title, category, instructor_id, level, mode, price, duration, image, short_desc, full_desc, syllabus)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.title, c.category, c.instructorId, c.level, c.mode, c.price, c.duration, c.image || "", c.shortDesc, c.fullDesc, JSON.stringify(c.syllabus)]
      );
    }

    for (const s of data.schedule) {
      await client.query(
        `INSERT INTO schedule (id, course_id, instructor_id, day, time_range)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.courseId, s.instructorId, s.day, s.time]
      );
    }

    for (const a of data.announcements) {
      await client.query(
        `INSERT INTO announcements (id, title, message, date) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.title, a.message, a.date]
      );
    }

    for (const t of data.testimonials) {
      await client.query(
        `INSERT INTO testimonials (id, name, rating, comment, date, approved, hidden)
         VALUES ($1,$2,$3,$4,$5,$6,false) ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name, t.rating, t.comment, t.date, t.approved]
      );
    }

    for (const f of data.faqs) {
      await client.query(
        `INSERT INTO faqs (id, question, answer) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [f.id, f.question, f.answer]
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
