const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");
const email = require("../services/email");
const calendar = require("../services/googleCalendar");

const router = express.Router();

function toDTO(row, courseTitle) {
  return {
    id: row.id,
    studentName: row.student_name,
    email: row.email,
    phone: row.phone,
    courseId: row.course_id,
    courseTitle: courseTitle || null,
    notes: row.notes,
    status: row.status,
    meetingLink: row.meeting_link,
    meetingTime: row.meeting_time,
    createdAt: row.created_at,
  };
}

router.get("/", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, c.title AS course_title FROM registrations r
     LEFT JOIN courses c ON c.id = r.course_id
     ORDER BY r.created_at DESC`
  );
  res.json(result.rows.map((row) => toDTO(row, row.course_title)));
});

router.post("/", async (req, res) => {
  const { studentName, email: studentEmail, phone = "", courseId = null, notes = "" } = req.body;
  if (!studentName || !studentEmail) return res.status(400).json({ error: "Name and email are required." });

  const id = `reg-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO registrations (id, student_name, email, phone, course_id, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
    [id, studentName, studentEmail, phone, courseId, notes]
  );

  // Notify admin/instructor — failure here shouldn't fail the registration itself.
  try {
    let courseTitle = null;
    let notifyTo = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (courseId) {
      const courseResult = await pool.query(
        `SELECT c.title, i.email AS instructor_email FROM courses c
         LEFT JOIN instructors i ON i.id = c.instructor_id WHERE c.id = $1`,
        [courseId]
      );
      courseTitle = courseResult.rows[0]?.title || null;
      notifyTo = courseResult.rows[0]?.instructor_email || notifyTo;
    }
    if (notifyTo) {
      await email.sendNewRegistrationAlert({
        to: notifyTo,
        studentName,
        studentEmail,
        studentPhone: phone,
        courseTitle,
        notes,
      });
    }
  } catch (err) {
    console.error("Failed to send registration alert email:", err.message);
  }

  res.status(201).json(toDTO(result.rows[0]));
});

/**
 * Confirm a registration: creates a real Google Calendar event with a Meet
 * link (inviting the student and instructor), stores the meeting details,
 * and emails the student the confirmation + join link.
 * Body: { meetingTime: ISO string, durationMinutes?: number }
 */
router.post("/:id/confirm", requireAdmin, async (req, res) => {
  const { meetingTime, durationMinutes = 60 } = req.body;
  if (!meetingTime) return res.status(400).json({ error: "meetingTime (ISO datetime) is required to schedule the meeting." });

  const regResult = await pool.query(
    `SELECT r.*, c.title AS course_title, i.email AS instructor_email FROM registrations r
     LEFT JOIN courses c ON c.id = r.course_id
     LEFT JOIN instructors i ON i.id = c.instructor_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  const reg = regResult.rows[0];
  if (!reg) return res.status(404).json({ error: "Registration not found." });

  let meeting;
  try {
    meeting = await calendar.createMeetingEvent({
      summary: `Apex session: ${reg.course_title || "General session"} — ${reg.student_name}`,
      description: reg.notes || "Scheduled via Apex Education Center.",
      startTime: meetingTime,
      durationMinutes,
      attendeeEmails: [reg.email, reg.instructor_email].filter(Boolean),
    });
  } catch (err) {
    return res.status(502).json({ error: `Could not create the Google Calendar meeting: ${err.message}` });
  }

  const updated = await pool.query(
    `UPDATE registrations SET status = 'confirmed', meeting_link = $2, meeting_event_id = $3, meeting_time = $4
     WHERE id = $1 RETURNING *`,
    [req.params.id, meeting.meetLink, meeting.eventId, meetingTime]
  );

  try {
    await email.sendConfirmationWithMeeting({
      to: reg.email,
      studentName: reg.student_name,
      courseTitle: reg.course_title,
      meetingTime: new Date(meetingTime).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }),
      meetingLink: meeting.meetLink,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err.message);
  }

  res.json(toDTO(updated.rows[0], reg.course_title));
});

router.post("/:id/decline", requireAdmin, async (req, res) => {
  const regResult = await pool.query(
    `SELECT r.*, c.title AS course_title FROM registrations r LEFT JOIN courses c ON c.id = r.course_id WHERE r.id = $1`,
    [req.params.id]
  );
  const reg = regResult.rows[0];
  if (!reg) return res.status(404).json({ error: "Registration not found." });

  if (reg.meeting_event_id) {
    await calendar.deleteMeetingEvent(reg.meeting_event_id).catch(() => {});
  }

  const updated = await pool.query(
    `UPDATE registrations SET status = 'declined', meeting_link = NULL, meeting_event_id = NULL, meeting_time = NULL WHERE id = $1 RETURNING *`,
    [req.params.id]
  );

  try {
    await email.sendDeclineNotice({ to: reg.email, studentName: reg.student_name, courseTitle: reg.course_title });
  } catch (err) {
    console.error("Failed to send decline email:", err.message);
  }

  res.json(toDTO(updated.rows[0], reg.course_title));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const regResult = await pool.query(`SELECT meeting_event_id FROM registrations WHERE id = $1`, [req.params.id]);
  if (regResult.rows[0]?.meeting_event_id) {
    await calendar.deleteMeetingEvent(regResult.rows[0].meeting_event_id).catch(() => {});
  }
  await pool.query(`DELETE FROM registrations WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
