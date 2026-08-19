require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: '10mb' }));

// ---- API routes ----
app.use("/api/admin", require("./routes/admin"));
app.use("/api/instructors", require("./routes/instructors"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/faqs", require("./routes/faqs"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api", require("./routes/contact")); // /api/contact, /api/newsletter
app.use("/api", require("./routes/siteInfo")); // /api/site-info, /api/stats, /api/categories

// ---- Google OAuth (one-time admin authorization for Calendar) ----
app.use("/auth", require("./routes/googleAuth"));

// ---- Never serve the server/ folder itself over HTTP ----
// (Express's static middleware ignores dotfiles like .env by default, but
// it would otherwise happily serve server.js, db/pool.js, node_modules,
// etc. — none of that should be publicly reachable.)
app.use((req, res, next) => {
  if (req.path.toLowerCase().startsWith("/server")) return res.status(404).end();
  next();
});

// ---- Serve the static frontend (the folder one level up) ----
const frontendRoot = path.join(__dirname, "..");
app.use(express.static(frontendRoot));

// Basic error handler so unexpected failures return JSON, not a stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Apex server running at http://localhost:${PORT}`);
});
