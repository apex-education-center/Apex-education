/**
 * admin.js
 * Everything for admin.html (login) and dashboard.html (the Command
 * Center). Auth is now a real server-side session (httpOnly cookie set
 * by the Express server) — the browser never sees or stores the password.
 */

/* ---------- Login page ---------- */
function initAdminLogin() {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;
  const errorEl = document.getElementById("loginError");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";
    try {
      await ApexDB.adminLogin(form.elements["password"].value);
      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = err.message || "Incorrect password. Try again.";
      errorEl.classList.add("show");
      form.elements["password"].classList.add("invalid");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });
}

/* ---------- Dashboard guard ---------- */
async function requireAdminAuth() {
  if (!document.getElementById("adminShell")) return true;
  try {
    await ApexDB.getGoogleStatus(); // any admin-only endpoint doubles as a session check
    return true;
  } catch {
    window.location.href = "admin.html";
    return false;
  }
}

function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await ApexDB.adminLogout();
    window.location.href = "admin.html";
  });
}

/* ---------- Toasts ---------- */
function toast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------- Modal shell ---------- */
function openModal(html) {
  const overlay = document.getElementById("modalOverlay");
  const box = document.getElementById("modalBox");
  box.innerHTML = html;
  overlay.classList.add("open");
  const closeBtn = box.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}
function wireModalOverlayClose() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

/* ---------- Image upload helper (FileReader -> base64) ---------- */
function wireImageUpload(uploadBoxId, inputId, previewId, hiddenFieldId) {
  const box = document.getElementById(uploadBoxId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const hidden = document.getElementById(hiddenFieldId);
  if (!box || !input) return;
  box.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      hidden.value = reader.result;
      preview.src = reader.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

function confirmDelete(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

/** Wraps an async action with a try/catch that toasts any server error message. */
async function runAction(action, successMessage) {
  try {
    await action();
    if (successMessage) toast(successMessage, "success");
    return true;
  } catch (err) {
    toast(err.message || "Something went wrong.", "error");
    return false;
  }
}

/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */
function initSidebarNav() {
  const links = document.querySelectorAll(".admin-nav-link[data-panel]");
  const panels = document.querySelectorAll(".admin-panel");
  const title = document.getElementById("topbarTitle");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.panel;
      links.forEach((l) => l.classList.toggle("active", l === link));
      panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${target}`));
      if (title) title.textContent = link.querySelector("span").textContent;
      renderPanel(target);
    });
  });
}

function renderPanel(name) {
  const renderers = {
    overview: renderOverview,
    courses: renderCoursesPanel,
    instructors: renderInstructorsPanel,
    schedule: renderSchedulePanel,
    testimonials: renderTestimonialsPanel,
    registrations: renderRegistrationsPanel,
    announcements: renderAnnouncementsPanel,
    faqs: renderFaqsPanel,
    homepage: renderHomepagePanel,
    contact: renderContactPanel,
    settings: renderSettingsPanel,
  };
  if (renderers[name]) renderers[name]();
}

function statCard(label, value, icon) {
  return `<div class="stat-card"><div class="stat-card-icon">${icon}</div><div><div class="stat-card-value">${value}</div><div class="stat-card-label">${label}</div></div></div>`;
}

function iconSvgAdmin(name) {
  const icons = {
    book: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/></svg>`,
    users: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15 20a5 5 0 0 1 8.5-3.6"/></svg>`,
    clipboard: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3.5" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="3" rx="1"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.8 9.8 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>`,
  };
  return icons[name] || "";
}

function emptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}" style="text-align:center;color:var(--color-text-faint);padding:32px;">${message}</td></tr>`;
}

/* ============================================================
   OVERVIEW
   ============================================================ */
async function renderOverview() {
  const el = document.getElementById("panel-overview");
  if (!el) return;
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;

  const [courses, instructors, registrations, testimonials] = await Promise.all([
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("registrations"),
    ApexDB.getCollection("testimonials", { all: true }),
  ]);
  const pendingRegs = registrations.filter((r) => r.status === "pending" || !r.status).length;
  const pendingTestimonials = testimonials.filter((t) => !t.approved && !t.hidden).length;

  el.innerHTML = `
    <div class="stat-cards">
      ${statCard("Courses", courses.length, iconSvgAdmin("book"))}
      ${statCard("Instructors", instructors.length, iconSvgAdmin("users"))}
      ${statCard("Registrations", registrations.length, iconSvgAdmin("clipboard"))}
      ${statCard("Pending Reviews", pendingRegs + pendingTestimonials, iconSvgAdmin("bell"))}
    </div>

    <div class="admin-toolbar"><h2>Recent Registrations</h2></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${
            registrations
              .slice(0, 6)
              .map((r) => `<tr>
                  <td>${r.studentName}<div style="color:var(--color-text-faint);font-size:0.78rem;">${r.email}</div></td>
                  <td>${r.courseTitle || "General inquiry"}</td>
                  <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                  <td><span class="status-pill status-${r.status || "pending"}">${r.status || "pending"}</span></td>
                </tr>`)
              .join("") || emptyRow(4, "No registrations yet.")
          }
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   COURSES
   ============================================================ */
async function renderCoursesPanel() {
  const el = document.getElementById("panel-courses");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const [courses, instructors, categories] = await Promise.all([
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("categories"),
  ]);

  el.innerHTML = `
    <div class="admin-toolbar">
      <h2>Courses (${courses.length})</h2>
      <button class="btn btn-primary btn-sm" id="addCourseBtn">+ Add Course</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th></th><th>Title</th><th>Category</th><th>Instructor</th><th>Price</th><th>Mode</th><th></th></tr></thead>
        <tbody>
          ${courses
            .map((c) => {
              const instr = instructors.find((i) => i.id === c.instructorId);
              const cat = categories.find((cc) => cc.id === c.category);
              return `<tr>
                <td>${c.image ? `<img src="${c.image}" class="row-thumb"/>` : `<div class="row-thumb"></div>`}</td>
                <td>${c.title}</td>
                <td>${cat ? cat.name : "—"}</td>
                <td>${instr ? instr.name : "—"}</td>
                <td>$${c.price}/hr</td>
                <td>${c.mode}</td>
                <td><div class="table-actions">
                  <button class="icon-btn" data-edit-course="${c.id}">${iconSvgAdmin("edit")}</button>
                  <button class="icon-btn danger" data-delete-course="${c.id}">${iconSvgAdmin("trash")}</button>
                </div></td>
              </tr>`;
            })
            .join("") || emptyRow(7, "No courses yet.")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("addCourseBtn").addEventListener("click", () => openCourseModal(null, instructors, categories));
  el.querySelectorAll("[data-edit-course]").forEach((b) =>
    b.addEventListener("click", () => openCourseModal(courses.find((c) => c.id === b.dataset.editCourse), instructors, categories))
  );
  el.querySelectorAll("[data-delete-course]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this course? This cannot be undone.", async () => {
        if (await runAction(() => ApexDB.deleteItem("courses", b.dataset.deleteCourse), "Course deleted.")) renderCoursesPanel();
      })
    )
  );
}

function openCourseModal(course, instructors, categories) {
  const isEdit = Boolean(course);

  openModal(`
    <div class="modal-header"><h3>${isEdit ? "Edit Course" : "Add Course"}</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <form id="courseForm">
      <div class="image-upload" id="courseImageBox">
        <img id="courseImagePreview" src="${course?.image || ""}" style="${course?.image ? "" : "display:none;"}"/>
        <span>Click to upload course image</span>
        <input type="file" id="courseImageInput" accept="image/*"/>
      </div>
      <input type="hidden" id="courseImageValue" value="${course?.image || ""}"/>

      <div class="form-group"><label>Title</label><input name="title" required value="${course?.title || ""}"/></div>
      <div class="form-grid">
        <div class="form-group"><label>Category</label>
          <select name="category" required>${categories.map((c) => `<option value="${c.id}" ${course?.category === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select>
        </div>
        <div class="form-group"><label>Instructor</label>
          <select name="instructorId" required>${instructors.map((i) => `<option value="${i.id}" ${course?.instructorId === i.id ? "selected" : ""}>${i.name}</option>`).join("")}</select>
        </div>
        <div class="form-group"><label>Level</label><input name="level" required value="${course?.level || ""}" placeholder="Beginner / Intermediate / Advanced"/></div>
        <div class="form-group"><label>Mode</label>
          <select name="mode" required><option ${course?.mode === "Online" ? "selected" : ""}>Online</option><option ${course?.mode === "Présentiel" ? "selected" : ""}>Présentiel</option></select>
        </div>
        <div class="form-group"><label>Price ($/hr)</label><input type="number" name="price" min="1" required value="${course?.price ?? ""}"/></div>
        <div class="form-group"><label>Duration</label><input name="duration" required value="${course?.duration || ""}" placeholder="8 weeks"/></div>
      </div>
      <div class="form-group"><label>Short Description</label><textarea name="shortDesc" required rows="2">${course?.shortDesc || ""}</textarea></div>
      <div class="form-group"><label>Full Description</label><textarea name="fullDesc" required rows="3">${course?.fullDesc || ""}</textarea></div>
      <div class="form-group"><label>Syllabus (one item per line)</label><textarea name="syllabus" rows="4">${course?.syllabus?.join("\n") || ""}</textarea></div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save Changes" : "Add Course"}</button>
    </form>
  `);

  wireImageUpload("courseImageBox", "courseImageInput", "courseImagePreview", "courseImageValue");

  document.getElementById("courseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get("title").trim(),
      category: fd.get("category"),
      instructorId: fd.get("instructorId"),
      level: fd.get("level").trim(),
      mode: fd.get("mode"),
      price: Number(fd.get("price")),
      duration: fd.get("duration").trim(),
      shortDesc: fd.get("shortDesc").trim(),
      fullDesc: fd.get("fullDesc").trim(),
      syllabus: fd.get("syllabus").split("\n").map((s) => s.trim()).filter(Boolean),
      image: document.getElementById("courseImageValue").value,
    };
    const ok = await runAction(
      () => (isEdit ? ApexDB.updateItem("courses", course.id, payload) : ApexDB.addItem("courses", payload)),
      isEdit ? "Course updated." : "Course added."
    );
    if (ok) {
      closeModal();
      renderCoursesPanel();
    }
  });
}

/* ============================================================
   INSTRUCTORS
   ============================================================ */
async function renderInstructorsPanel() {
  const el = document.getElementById("panel-instructors");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const instructors = await ApexDB.getCollection("instructors");

  el.innerHTML = `
    <div class="admin-toolbar">
      <h2>Instructors (${instructors.length})</h2>
      <button class="btn btn-primary btn-sm" id="addInstructorBtn">+ Add Instructor</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th></th><th>Name</th><th>Subject</th><th>Email</th><th>Experience</th><th></th></tr></thead>
        <tbody>
          ${instructors
            .map(
              (i) => `<tr>
                <td>${i.photo ? `<img src="${i.photo}" class="row-thumb" style="border-radius:50%;"/>` : `<div class="row-thumb" style="border-radius:50%;"></div>`}</td>
                <td>${i.name}</td>
                <td>${i.subject}</td>
                <td>${i.email}</td>
                <td>${i.experience}</td>
                <td><div class="table-actions">
                  <button class="icon-btn" data-edit-instructor="${i.id}">${iconSvgAdmin("edit")}</button>
                  <button class="icon-btn danger" data-delete-instructor="${i.id}">${iconSvgAdmin("trash")}</button>
                </div></td>
              </tr>`
            )
            .join("") || emptyRow(6, "No instructors yet.")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("addInstructorBtn").addEventListener("click", () => openInstructorModal());
  el.querySelectorAll("[data-edit-instructor]").forEach((b) =>
    b.addEventListener("click", () => openInstructorModal(instructors.find((i) => i.id === b.dataset.editInstructor)))
  );
  el.querySelectorAll("[data-delete-instructor]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this instructor? Their courses will remain but show no instructor.", async () => {
        if (await runAction(() => ApexDB.deleteItem("instructors", b.dataset.deleteInstructor), "Instructor deleted.")) renderInstructorsPanel();
      })
    )
  );
}

function openInstructorModal(instructor) {
  const isEdit = Boolean(instructor);
  openModal(`
    <div class="modal-header"><h3>${isEdit ? "Edit Instructor" : "Add Instructor"}</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <form id="instructorForm">
      <div class="image-upload" id="instructorImageBox">
        <img id="instructorImagePreview" src="${instructor?.photo || ""}" style="${instructor?.photo ? "" : "display:none;"}"/>
        <span>Click to upload photo</span>
        <input type="file" id="instructorImageInput" accept="image/*"/>
      </div>
      <input type="hidden" id="instructorImageValue" value="${instructor?.photo || ""}"/>

      <div class="form-grid">
        <div class="form-group"><label>Full Name</label><input name="name" required value="${instructor?.name || ""}"/></div>
        <div class="form-group"><label>Subject</label><input name="subject" required value="${instructor?.subject || ""}"/></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" required value="${instructor?.email || ""}"/></div>
        <div class="form-group"><label>Experience</label><input name="experience" required value="${instructor?.experience || ""}" placeholder="e.g. 8 years"/></div>
      </div>
      <div class="form-group"><label>Bio</label><textarea name="bio" required rows="3">${instructor?.bio || ""}</textarea></div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save Changes" : "Add Instructor"}</button>
    </form>
  `);

  wireImageUpload("instructorImageBox", "instructorImageInput", "instructorImagePreview", "instructorImageValue");

  document.getElementById("instructorForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name").trim(),
      subject: fd.get("subject").trim(),
      email: fd.get("email").trim(),
      experience: fd.get("experience").trim(),
      bio: fd.get("bio").trim(),
      photo: document.getElementById("instructorImageValue").value,
    };
    const ok = await runAction(
      () => (isEdit ? ApexDB.updateItem("instructors", instructor.id, payload) : ApexDB.addItem("instructors", payload)),
      isEdit ? "Instructor updated." : "Instructor added."
    );
    if (ok) {
      closeModal();
      renderInstructorsPanel();
    }
  });
}

/* ============================================================
   SCHEDULE
   ============================================================ */
async function renderSchedulePanel() {
  const el = document.getElementById("panel-schedule");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const [schedule, courses, instructors] = await Promise.all([
    ApexDB.getCollection("schedule"),
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
  ]);

  el.innerHTML = `
    <div class="admin-toolbar">
      <h2>Schedule (${schedule.length})</h2>
      <button class="btn btn-primary btn-sm" id="addScheduleBtn">+ Add Time Slot</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Course</th><th>Instructor</th><th>Day</th><th>Time</th><th></th></tr></thead>
        <tbody>
          ${schedule
            .map((s) => {
              const course = courses.find((c) => c.id === s.courseId);
              const instr = instructors.find((i) => i.id === s.instructorId);
              return `<tr>
                <td>${course ? course.title : "—"}</td>
                <td>${instr ? instr.name : "—"}</td>
                <td>${s.day}</td>
                <td class="time-cell">${s.time}</td>
                <td><div class="table-actions"><button class="icon-btn danger" data-delete-schedule="${s.id}">${iconSvgAdmin("trash")}</button></div></td>
              </tr>`;
            })
            .join("") || emptyRow(5, "No schedule entries yet.")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("addScheduleBtn").addEventListener("click", () => openScheduleModal(courses, instructors));
  el.querySelectorAll("[data-delete-schedule]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Remove this schedule entry?", async () => {
        if (await runAction(() => ApexDB.deleteItem("schedule", b.dataset.deleteSchedule), "Schedule entry removed.")) renderSchedulePanel();
      })
    )
  );
}

function openScheduleModal(courses, instructors) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  openModal(`
    <div class="modal-header"><h3>Add Time Slot</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <form id="scheduleForm">
      <div class="form-group"><label>Course</label>
        <select name="courseId" required>${courses.map((c) => `<option value="${c.id}">${c.title}</option>`).join("")}</select>
      </div>
      <div class="form-group"><label>Instructor</label>
        <select name="instructorId" required>${instructors.map((i) => `<option value="${i.id}">${i.name}</option>`).join("")}</select>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Day</label><select name="day" required>${days.map((d) => `<option>${d}</option>`).join("")}</select></div>
        <div class="form-group"><label>Time</label><input name="time" required placeholder="16:00 - 17:30"/></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Add Time Slot</button>
    </form>
  `);

  document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ok = await runAction(
      () => ApexDB.addItem("schedule", { courseId: fd.get("courseId"), instructorId: fd.get("instructorId"), day: fd.get("day"), time: fd.get("time").trim() }),
      "Time slot added."
    );
    if (ok) {
      closeModal();
      renderSchedulePanel();
    }
  });
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
async function renderTestimonialsPanel() {
  const el = document.getElementById("panel-testimonials");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const testimonials = await ApexDB.getCollection("testimonials", { all: true });

  el.innerHTML = `
    <div class="admin-toolbar"><h2>Feedback (${testimonials.length})</h2></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${testimonials
            .map((t) => {
              const status = t.hidden ? "hidden" : t.approved ? "approved" : "pending";
              return `<tr>
                <td>${t.name}</td>
                <td>${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)}</td>
                <td style="max-width:260px;">${t.comment.slice(0, 80)}${t.comment.length > 80 ? "…" : ""}</td>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td><span class="status-pill status-${status}">${status}</span></td>
                <td><div class="table-actions">
                  ${!t.approved && !t.hidden ? `<button class="icon-btn" title="Approve" data-approve-test="${t.id}">${iconSvgAdmin("check")}</button>` : ""}
                  ${t.approved ? `<button class="icon-btn" title="Hide" data-hide-test="${t.id}">${iconSvgAdmin("eyeOff")}</button>` : ""}
                  <button class="icon-btn danger" title="Delete" data-delete-test="${t.id}">${iconSvgAdmin("trash")}</button>
                </div></td>
              </tr>`;
            })
            .join("") || emptyRow(6, "No feedback submitted yet.")}
        </tbody>
      </table>
    </div>
  `;

  el.querySelectorAll("[data-approve-test]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (await runAction(() => ApexDB.updateItem("testimonials", b.dataset.approveTest, { approved: true, hidden: false }), "Feedback approved and published."))
        renderTestimonialsPanel();
    })
  );
  el.querySelectorAll("[data-hide-test]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (await runAction(() => ApexDB.updateItem("testimonials", b.dataset.hideTest, { hidden: true, approved: false }), "Feedback hidden.")) renderTestimonialsPanel();
    })
  );
  el.querySelectorAll("[data-delete-test]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this feedback permanently?", async () => {
        if (await runAction(() => ApexDB.deleteItem("testimonials", b.dataset.deleteTest), "Feedback deleted.")) renderTestimonialsPanel();
      })
    )
  );
}

/* ============================================================
   REGISTRATIONS — real meeting scheduling
   ============================================================ */
async function renderRegistrationsPanel() {
  const el = document.getElementById("panel-registrations");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const registrations = await ApexDB.getCollection("registrations");

  el.innerHTML = `
    <div class="admin-toolbar"><h2>Registrations (${registrations.length})</h2></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Student</th><th>Contact</th><th>Course</th><th>Date Submitted</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${registrations
            .map((r) => {
              const status = r.status || "pending";
              return `<tr>
                <td>${r.studentName}</td>
                <td>${r.email}<div style="color:var(--color-text-faint);font-size:0.78rem;">${r.phone || ""}</div></td>
                <td>${r.courseTitle || "General inquiry"}</td>
                <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                <td><span class="status-pill status-${status}">${status}</span>
                  ${r.meetingLink ? `<div style="margin-top:4px;"><a href="${r.meetingLink}" target="_blank" rel="noopener noreferrer" style="font-size:0.76rem;color:var(--color-primary);">Meet link ↗</a></div>` : ""}
                </td>
                <td><div class="table-actions">
                  ${status === "pending" ? `<button class="icon-btn" title="Schedule & Confirm" data-accept-reg="${r.id}">${iconSvgAdmin("calendar")}</button><button class="icon-btn danger" title="Decline" data-reject-reg="${r.id}">${iconSvgAdmin("close")}</button>` : ""}
                  <button class="icon-btn danger" title="Delete" data-delete-reg="${r.id}">${iconSvgAdmin("trash")}</button>
                </div></td>
              </tr>`;
            })
            .join("") || emptyRow(6, "No registrations submitted yet.")}
        </tbody>
      </table>
    </div>
  `;

  el.querySelectorAll("[data-accept-reg]").forEach((b) =>
    b.addEventListener("click", () => {
      const reg = registrations.find((r) => r.id === b.dataset.acceptReg);
      openConfirmMeetingModal(reg);
    })
  );
  el.querySelectorAll("[data-reject-reg]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Decline this registration? The student will be notified by email.", async () => {
        if (await runAction(() => ApexDB.declineRegistration(b.dataset.rejectReg), "Registration declined.")) renderRegistrationsPanel();
      })
    )
  );
  el.querySelectorAll("[data-delete-reg]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this registration record?", async () => {
        if (await runAction(() => ApexDB.deleteItem("registrations", b.dataset.deleteReg), "Registration deleted.")) renderRegistrationsPanel();
      })
    )
  );
}

/**
 * Confirming a registration needs a real date/time — that's what gets
 * used to create the actual Google Calendar event and Meet link.
 */
function openConfirmMeetingModal(reg) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 60);
  const defaultValue = now.toISOString().slice(0, 16);

  openModal(`
    <div class="modal-header"><h3>Schedule Meeting</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <p style="margin-bottom:18px;font-size:0.9rem;color:var(--color-text-muted);">
      This creates a real Google Calendar event with a Meet link, invites <strong>${reg.email}</strong>${reg.courseTitle ? ` for <strong>${reg.courseTitle}</strong>` : ""}, and emails them the confirmation.
    </p>
    <form id="confirmMeetingForm">
      <div class="form-group"><label>Date & Time</label><input type="datetime-local" name="meetingTime" required value="${defaultValue}"/></div>
      <div class="form-group"><label>Duration (minutes)</label><input type="number" name="durationMinutes" value="60" min="15" step="15" required/></div>
      <div class="field-error" id="confirmMeetingError"></div>
      <button type="submit" class="btn btn-primary btn-block">Confirm & Create Meeting</button>
    </form>
  `);

  document.getElementById("confirmMeetingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById("confirmMeetingError");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating meeting…";
    try {
      const meetingTime = new Date(fd.get("meetingTime")).toISOString();
      await ApexDB.confirmRegistration(reg.id, meetingTime, Number(fd.get("durationMinutes")));
      toast("Meeting created and student notified by email.", "success");
      closeModal();
      renderRegistrationsPanel();
    } catch (err) {
      errorEl.textContent = err.message || "Could not create the meeting.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm & Create Meeting";
    }
  });
}

/* ============================================================
   ANNOUNCEMENTS
   ============================================================ */
async function renderAnnouncementsPanel() {
  const el = document.getElementById("panel-announcements");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const announcements = await ApexDB.getCollection("announcements");

  el.innerHTML = `
    <div class="admin-toolbar">
      <h2>Announcements (${announcements.length})</h2>
      <button class="btn btn-primary btn-sm" id="addAnnouncementBtn">+ Add Announcement</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Title</th><th>Message</th><th>Date</th><th></th></tr></thead>
        <tbody>
          ${announcements
            .map(
              (a) => `<tr>
                <td>${a.title}</td>
                <td style="max-width:320px;">${a.message}</td>
                <td>${new Date(a.date).toLocaleDateString()}</td>
                <td><div class="table-actions"><button class="icon-btn danger" data-delete-ann="${a.id}">${iconSvgAdmin("trash")}</button></div></td>
              </tr>`
            )
            .join("") || emptyRow(4, "No announcements yet.")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("addAnnouncementBtn").addEventListener("click", () => openAnnouncementModal());
  el.querySelectorAll("[data-delete-ann]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this announcement?", async () => {
        if (await runAction(() => ApexDB.deleteItem("announcements", b.dataset.deleteAnn), "Announcement deleted.")) renderAnnouncementsPanel();
      })
    )
  );
}

function openAnnouncementModal() {
  openModal(`
    <div class="modal-header"><h3>Add Announcement</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <form id="announcementForm">
      <div class="form-group"><label>Title</label><input name="title" required/></div>
      <div class="form-group"><label>Message</label><textarea name="message" required rows="3"></textarea></div>
      <button type="submit" class="btn btn-primary btn-block">Add Announcement</button>
    </form>
  `);
  document.getElementById("announcementForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ok = await runAction(
      () => ApexDB.addItem("announcements", { title: fd.get("title").trim(), message: fd.get("message").trim() }),
      "Announcement published."
    );
    if (ok) {
      closeModal();
      renderAnnouncementsPanel();
    }
  });
}

/* ============================================================
   FAQS
   ============================================================ */
async function renderFaqsPanel() {
  const el = document.getElementById("panel-faqs");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const faqs = await ApexDB.getCollection("faqs");

  el.innerHTML = `
    <div class="admin-toolbar">
      <h2>FAQs (${faqs.length})</h2>
      <button class="btn btn-primary btn-sm" id="addFaqBtn">+ Add FAQ</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Question</th><th></th></tr></thead>
        <tbody>
          ${faqs
            .map(
              (f) => `<tr>
                <td>${f.question}</td>
                <td><div class="table-actions">
                  <button class="icon-btn" data-edit-faq="${f.id}">${iconSvgAdmin("edit")}</button>
                  <button class="icon-btn danger" data-delete-faq="${f.id}">${iconSvgAdmin("trash")}</button>
                </div></td>
              </tr>`
            )
            .join("") || emptyRow(2, "No FAQs yet.")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("addFaqBtn").addEventListener("click", () => openFaqModal(null));
  el.querySelectorAll("[data-edit-faq]").forEach((b) =>
    b.addEventListener("click", () => openFaqModal(faqs.find((f) => f.id === b.dataset.editFaq)))
  );
  el.querySelectorAll("[data-delete-faq]").forEach((b) =>
    b.addEventListener("click", () =>
      confirmDelete("Delete this FAQ?", async () => {
        if (await runAction(() => ApexDB.deleteItem("faqs", b.dataset.deleteFaq), "FAQ deleted.")) renderFaqsPanel();
      })
    )
  );
}

function openFaqModal(faq) {
  const isEdit = Boolean(faq);
  openModal(`
    <div class="modal-header"><h3>${isEdit ? "Edit FAQ" : "Add FAQ"}</h3><button class="modal-close">${iconSvgAdmin("close")}</button></div>
    <form id="faqForm">
      <div class="form-group"><label>Question</label><input name="question" required value="${faq?.question || ""}"/></div>
      <div class="form-group"><label>Answer</label><textarea name="answer" required rows="4">${faq?.answer || ""}</textarea></div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save Changes" : "Add FAQ"}</button>
    </form>
  `);
  document.getElementById("faqForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { question: fd.get("question").trim(), answer: fd.get("answer").trim() };
    const ok = await runAction(
      () => (isEdit ? ApexDB.updateItem("faqs", faq.id, payload) : ApexDB.addItem("faqs", payload)),
      isEdit ? "FAQ updated." : "FAQ added."
    );
    if (ok) {
      closeModal();
      renderFaqsPanel();
    }
  });
}

/* ============================================================
   HOMEPAGE CONTENT
   ============================================================ */
async function renderHomepagePanel() {
  const el = document.getElementById("panel-homepage");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const [info, stats] = await Promise.all([ApexDB.getSiteInfo(), ApexDB.getStats()]);
  const hp = info.homepage || {};

  el.innerHTML = `
    <div class="admin-toolbar"><h2>Homepage Content</h2></div>
    <div class="form-card" style="max-width:640px;">
      <form id="homepageForm">
        <div class="form-group"><label>Hero Title</label><input name="heroTitle" value="${hp.heroTitle || ""}"/></div>
        <div class="form-group"><label>Hero Subtitle</label><textarea name="heroSubtitle" rows="3">${hp.heroSubtitle || ""}</textarea></div>
        <div class="form-group"><label>About Summary</label><textarea name="aboutSummary" rows="3">${hp.aboutSummary || ""}</textarea></div>
        <div class="form-grid">
          <div class="form-group"><label>Students</label><input type="number" name="students" value="${stats.students ?? 0}"/></div>
          <div class="form-group"><label>Courses</label><input type="number" name="courses" value="${stats.courses ?? 0}"/></div>
          <div class="form-group"><label>Instructors</label><input type="number" name="instructors" value="${stats.instructors ?? 0}"/></div>
          <div class="form-group"><label>Years Experience</label><input type="number" name="years" value="${stats.years ?? 0}"/></div>
        </div>
        <button type="submit" class="btn btn-primary">Save Homepage Content</button>
      </form>
    </div>
  `;

  document.getElementById("homepageForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await runAction(async () => {
      await ApexDB.updateHomepage({
        heroTitle: fd.get("heroTitle").trim(),
        heroSubtitle: fd.get("heroSubtitle").trim(),
        aboutSummary: fd.get("aboutSummary").trim(),
      });
      await ApexDB.updateStats({
        students: Number(fd.get("students")),
        courses: Number(fd.get("courses")),
        instructors: Number(fd.get("instructors")),
        years: Number(fd.get("years")),
      });
    }, "Homepage content saved.");
  });
}

/* ============================================================
   CONTACT INFO
   ============================================================ */
async function renderContactPanel() {
  const el = document.getElementById("panel-contact");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;
  const info = await ApexDB.getSiteInfo();
  const social = info.social || {};

  el.innerHTML = `
    <div class="admin-toolbar"><h2>Contact Information</h2></div>
    <div class="form-card" style="max-width:640px;">
      <form id="contactInfoForm">
        <div class="form-grid">
          <div class="form-group"><label>Phone</label><input name="phone" value="${info.phone || ""}"/></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" value="${info.email || ""}"/></div>
          <div class="form-group"><label>WhatsApp Number (digits only)</label><input name="whatsapp" value="${info.whatsapp || ""}"/></div>
          <div class="form-group"><label>Address</label><input name="address" value="${info.address || ""}"/></div>
          <div class="form-group"><label>Facebook URL</label><input name="facebook" value="${social.facebook || ""}"/></div>
          <div class="form-group"><label>Instagram URL</label><input name="instagram" value="${social.instagram || ""}"/></div>
          <div class="form-group full"><label>Google Maps Embed URL</label><input name="mapEmbed" value="${info.mapEmbed || ""}"/></div>
          <div class="form-group full"><label>Brochure Link</label><input name="brochureUrl" value="${info.brochureUrl || ""}"/></div>
        </div>
        <button type="submit" class="btn btn-primary">Save Contact Info</button>
      </form>
    </div>
  `;

  document.getElementById("contactInfoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await runAction(
      () =>
        ApexDB.updateSiteInfo({
          phone: fd.get("phone").trim(),
          email: fd.get("email").trim(),
          whatsapp: fd.get("whatsapp").trim(),
          address: fd.get("address").trim(),
          mapEmbed: fd.get("mapEmbed").trim(),
          brochureUrl: fd.get("brochureUrl").trim(),
          social: { facebook: fd.get("facebook").trim(), instagram: fd.get("instagram").trim() },
        }),
      "Contact info saved."
    );
  });
}

/* ============================================================
   SETTINGS — password + real Google Calendar connection
   ============================================================ */
async function renderSettingsPanel() {
  const el = document.getElementById("panel-settings");
  el.innerHTML = `<p style="color:var(--color-text-faint);">Loading…</p>`;

  let googleConnected = false;
  try {
    const status = await ApexDB.getGoogleStatus();
    googleConnected = status.connected;
  } catch {
    // leave as false; the connect button will surface any real error on click
  }

  el.innerHTML = `
    <div class="admin-toolbar"><h2>Admin Settings</h2></div>

    <div class="form-card" style="max-width:460px;">
      <h3 style="margin-bottom:6px;">Google Calendar</h3>
      <p style="margin-bottom:16px;font-size:0.88rem;">
        ${googleConnected
          ? "Connected — confirming a registration will create a real Calendar event with a Meet link and email the student automatically."
          : "Not connected yet. Connect once so confirming a registration can create a real Google Meet meeting."}
      </p>
      <a href="/auth/google" class="btn ${googleConnected ? "btn-outline" : "btn-primary"}">
        ${googleConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
      </a>
    </div>

    <div class="form-card" style="max-width:460px;margin-top:20px;">
      <h3 style="margin-bottom:12px;">Change Admin Password</h3>
      <form id="passwordForm">
        <div class="form-group"><label>Current Password</label><input type="password" name="current" required/></div>
        <div class="form-group"><label>New Password</label><input type="password" name="next" required minlength="4"/></div>
        <div class="form-group"><label>Confirm New Password</label><input type="password" name="confirm" required minlength="4"/></div>
        <div class="field-error" id="pwError"></div>
        <button type="submit" class="btn btn-primary">Update Password</button>
      </form>
    </div>
  `;

  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const errorEl = document.getElementById("pwError");
    if (fd.get("next") !== fd.get("confirm")) {
      errorEl.textContent = "New passwords do not match.";
      return;
    }
    try {
      await ApexDB.adminChangePassword(fd.get("current"), fd.get("next"));
      errorEl.textContent = "";
      toast("Password updated.", "success");
      e.target.reset();
    } catch (err) {
      errorEl.textContent = err.message || "Could not update password.";
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  document.body.classList.add("loaded");
  initAdminLogin();
  if (!(await requireAdminAuth())) return;
  wireLogout();
  wireModalOverlayClose();
  initSidebarNav();
  renderOverview();
});
