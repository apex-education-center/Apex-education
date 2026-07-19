/**
 * main.js
 * Homepage-specific rendering plus a handful of generic utilities
 * (scroll reveals, animated counters, card templates) that other page
 * scripts (courses.js, feedback.js) also call.
 */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---------- Icon set (category chips + misc) ---------- */
function categoryIconSvg(name) {
  const icons = {
    calculator: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="19"/><line x1="8" y1="19" x2="12" y2="19"/></svg>`,
    atom: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></svg>`,
    flask: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v6l-6 11a1.5 1.5 0 0 0 1.3 2.2h13.4A1.5 1.5 0 0 0 20 19L14 8V2"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 15-10 0 11-4 17-8 17Z"/><path d="M4 20c4-5 6-7 11-13"/></svg>`,
    book: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><line x1="4" y1="19.5" x2="4" y2="6.5"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z"/></svg>`,
  };
  return icons[name] || icons.book;
}

function starIconSvg(filled) {
  return `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>`;
}

function starsHTML(rating) {
  return `<span class="stars">${[1, 2, 3, 4, 5].map((i) => starIconSvg(i <= rating)).join("")}</span>`;
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------- Card templates (shared with courses.js / feedback.js) ---------- */
function courseCardHTML(course, instructor, category) {
  return `
    <a href="course-details.html?id=${course.id}" class="course-card reveal-stagger">
      <div class="course-thumb" style="${course.image ? `background-image:url('${course.image}');background-size:cover;background-position:center;` : ""}">
        <span class="mode-badge">${course.mode}</span>
      </div>
      <div class="course-body">
        <span class="course-category">${category ? category.name : ""}</span>
        <h3>${course.title}</h3>
        <p class="desc">${course.shortDesc}</p>
        <div class="course-meta">
          <span class="course-price">$${course.price}<span>/hr</span></span>
          <span class="badge badge-teal">${course.level}</span>
        </div>
      </div>
    </a>
  `;
}

function instructorCardHTML(instructor) {
  const bg = instructor.photo ? `background-image:url('${instructor.photo}');` : "";
  return `
    <div class="instructor-card reveal-stagger">
      <div class="instructor-avatar" style="${bg}">${instructor.photo ? "" : initials(instructor.name)}</div>
      <h3>${instructor.name}</h3>
      <p class="instructor-subject">${instructor.subject}</p>
      <p class="bio">${instructor.bio}</p>
      <p class="instructor-exp">${instructor.experience} experience</p>
      <a href="courses.html?instructor=${instructor.id}" class="btn btn-outline btn-sm">View Courses</a>
    </div>
  `;
}

function testimonialCardHTML(t) {
  return `
    <div class="testimonial-card reveal-stagger">
      ${starsHTML(t.rating)}
      <p class="quote">&ldquo;${t.comment}&rdquo;</p>
      <div class="testimonial-footer">
        <div class="testimonial-avatar">${initials(t.name)}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-date">${new Date(t.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Scroll reveal (supports plain .reveal and cascading .reveal-stagger) ---------- */
function initScrollReveal() {
  const els = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!els.length) return;

  // Give each .reveal-stagger element an incremental delay based on its
  // position among its siblings, so groups (like the hero content) cascade
  // in rather than all fading up in perfect unison.
  const groups = new Map();
  els.forEach((el) => {
    if (!el.classList.contains("reveal-stagger")) return;
    const parent = el.parentElement;
    const index = groups.get(parent) || 0;
    el.style.transitionDelay = `${index * 90}ms`;
    groups.set(parent, index + 1);
  });

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => observer.observe(el));
}

/* ---------- Hero cursor-reactive glow ---------- */
function initHeroGlow() {
  const hero = document.querySelector(".hero");
  const glow = document.getElementById("heroGlow");
  if (!hero || !glow) return;

  let targetX = hero.offsetWidth * 0.55, targetY = hero.offsetHeight * 0.1;
  let curX = targetX, curY = targetY;

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left - 230;
    targetY = e.clientY - rect.top - 230;
  });

  function loop() {
    curX += (targetX - curX) * 0.07;
    curY += (targetY - curY) * 0.07;
    glow.style.transform = `translate(${curX}px, ${curY}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---------- Hero brand parallax ---------- */
function initHeroBrandParallax() {
  const mark = document.getElementById("heroBrandMark");
  const hero = document.querySelector(".hero-cinematic");
  if (!mark || !hero) return;
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0) return;
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
    mark.style.transform = `translateX(-50%) translateY(${progress * 40}px)`;
    mark.style.opacity = String(1 - progress * 0.55);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Scroll cue ---------- */
function initScrollCue() {
  const btn = document.getElementById("scrollCue");
  const hero = document.querySelector(".hero");
  if (!btn || !hero) return;
  btn.addEventListener("click", () => {
    const next = hero.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- Tilt-on-hover for cards (cinematic 3D on apex-cinema pages) ---------- */
function wireTiltCards(selector) {
  if (window.matchMedia("(hover: none)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cinema = document.body.classList.contains("apex-cinema");
  const rx = cinema ? 10 : 6;
  const ry = cinema ? 12 : 8;
  const lift = cinema ? 12 : 8;
  const z = cinema ? 18 : 0;
  document.querySelectorAll(`${selector}:not([data-tilt-wired])`).forEach((card) => {
    if (card.closest(".contact-promo-inner")) return;
    card.dataset.tiltWired = "true";
    card.style.transformStyle = "preserve-3d";
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${-py * rx}deg) rotateY(${px * ry}deg) translateY(-${lift}px) translateZ(${z}px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------- Magnetic buttons ---------- */
function wireMagneticButtons() {
  if (window.matchMedia("(hover: none)").matches) return;
  document.querySelectorAll(".btn-magnetic:not([data-magnetic-wired])").forEach((btn) => {
    btn.dataset.magneticWired = "true";
    btn.addEventListener("pointermove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ---------- Cinematic engine: spotlight + 3D tilt + watermark parallax ---------- */
function initCinemaEngine() {
  if (!document.body.classList.contains("apex-cinema")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Mouse spotlight
  if (window.matchMedia("(hover: hover)").matches) {
    let spot = document.querySelector(".cinema-spotlight");
    if (!spot) {
      spot = document.createElement("div");
      spot.className = "cinema-spotlight";
      document.body.appendChild(spot);
    }
    let sx = window.innerWidth / 2, sy = window.innerHeight / 2;
    let cx = sx, cy = sy;
    document.addEventListener("pointermove", (e) => {
      sx = e.clientX;
      sy = e.clientY;
    }, { passive: true });
    (function spotLoop() {
      cx += (sx - cx) * 0.08;
      cy += (sy - cy) * 0.08;
      spot.style.left = cx + "px";
      spot.style.top = cy + "px";
      requestAnimationFrame(spotLoop);
    })();
  }

  // Stronger 3D tilt — desktop hover only (skip on touch / narrow)
  if (
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(min-width: 861px)").matches
  ) {
    wireTiltCards(".course-card");
    wireTiltCards(".instructor-card");
    wireTiltCards(".form-card");
    wireTiltCards(".glass-panel");
    wireTiltCards(".testimonial-card");

    const mounts = document.querySelectorAll("#coursesGrid, #instructorsGrid, #faqMount, #scheduleMount, #featuredCourses, #instructorPreview, #testimonialPreview");
    if (mounts.length && typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        wireTiltCards(".course-card");
        wireTiltCards(".instructor-card");
        wireTiltCards(".testimonial-card");
      });
      mounts.forEach((m) => mo.observe(m, { childList: true, subtree: true }));
    }
  }

  // Watermark parallax on scroll (leave aurora to CSS animation)
  const marks = document.querySelectorAll(".ph-watermark, #heroBrandMark");
  if (marks.length) {
    const onScroll = () => {
      marks.forEach((el) => {
        const parent = el.closest(".page-hero-cinema, .hero-cinematic") || el.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
        const isHeroBrand = el.id === "heroBrandMark";
        if (isHeroBrand) {
          el.style.transform = `translateX(-50%) translateY(${progress * 48}px)`;
          el.style.opacity = String(1 - progress * 0.55);
        } else {
          const scene = el.closest("[data-scene]");
          const sceneName = scene ? scene.dataset.scene : "";
          if (sceneName === "about") {
            el.style.transform = `translateX(-50%) translate3d(0, ${progress * -50}px, -100px) rotateX(${25 - progress * 8}deg)`;
          } else if (sceneName === "feedback") {
            el.style.transform = `translate3d(${progress * 40}px, ${progress * -30}px, -60px) rotateY(12deg) rotateZ(-4deg)`;
          } else {
            el.style.transform = `translate3d(${progress * 56}px, ${progress * -40}px, -80px) rotateY(-10deg) scale(${1 + progress * 0.06})`;
          }
        }
      });
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Pointer parallax on hero orbs — desktop only
  if (
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(min-width: 861px)").matches
  ) {
    document.querySelectorAll(".page-hero-cinema").forEach((hero) => {
      const orbs = hero.querySelectorAll(".ph-orb");
      if (!orbs.length) return;
      hero.addEventListener("pointermove", (e) => {
        const rect = hero.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 18;
          orb.style.transform = `translate3d(${px * depth}px, ${py * depth}px, ${40 + i * 20}px)`;
        });
      });
    });
  }
}

/* ---------- Animated counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll(".stat-num[data-target]");
  if (!counters.length) return;
  const animate = (el) => {
    const target = Number(el.dataset.target);
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* ---------- Newsletter ---------- */
function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.elements["newsletterEmail"];
    const msg =
      form.querySelector(".newsletter-msg") ||
      form.parentElement?.querySelector(".newsletter-msg") ||
      document.querySelector(".finale .newsletter-msg");
    if (!msg) return;
    if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      msg.textContent = "Enter a valid email address.";
      msg.style.color = "var(--coral)";
      return;
    }
    try {
      await ApexDB.subscribeNewsletter(input.value.trim());
      msg.textContent = "Subscribed! Watch your inbox for updates.";
      msg.style.color = "var(--teal-bright, var(--teal))";
      form.reset();
    } catch (err) {
      msg.textContent = err.message || "Something went wrong. Please try again.";
      msg.style.color = "var(--coral)";
    }
  });
}

/* ---------- Instructors page (full listing) ---------- */
async function initInstructorsPage() {
  const grid = document.getElementById("instructorsGrid");
  if (!grid) return;
  const instructors = await ApexDB.getCollection("instructors");
  const subjects = Array.from(new Set(instructors.map((i) => i.subject)));
  const filterBar = document.getElementById("subjectFilterBar");

  filterBar.innerHTML =
    `<button class="filter-btn active" data-subject="all">All Subjects</button>` +
    subjects.map((s) => `<button class="filter-btn" data-subject="${s}">${s}</button>`).join("");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
    const subject = btn.dataset.subject;
    const filtered = subject === "all" ? instructors : instructors.filter((i) => i.subject === subject);
    grid.innerHTML = filtered.map(instructorCardHTML).join("");
    initScrollReveal();
    wireTiltCards(".instructor-card");
  });

  grid.innerHTML = instructors.map(instructorCardHTML).join("");
  initScrollReveal();
  wireTiltCards(".instructor-card");
}

/* ---------- Schedule page ---------- */
async function initSchedulePage() {
  const mount = document.getElementById("scheduleMount");
  if (!mount) return;

  const [schedule, courses, instructors] = await Promise.all([
    ApexDB.getCollection("schedule"),
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
  ]);
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (!schedule.length) {
    mount.innerHTML = `<div class="empty-state"><p>No scheduled sessions yet. Check back soon.</p></div>`;
    return;
  }

  const byDay = {};
  schedule.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });

  mount.innerHTML = dayOrder
    .filter((d) => byDay[d])
    .map(
      (day) => `
      <div class="reveal-stagger" style="margin-bottom:36px;">
        <h2 style="font-size:1.3rem;margin-bottom:14px;">${day}</h2>
        <table class="schedule-table">
          <thead><tr><th>Time</th><th>Course</th><th>Instructor</th><th>Mode</th></tr></thead>
          <tbody>
            ${byDay[day]
              .map((s) => {
                const course = courses.find((c) => c.id === s.courseId);
                const instr = instructors.find((i) => i.id === s.instructorId);
                return `<tr>
                  <td class="time-cell" data-label="Time">${s.time}</td>
                  <td data-label="Course">${course ? `<a href="course-details.html?id=${course.id}">${course.title}</a>` : "—"}</td>
                  <td data-label="Instructor">${instr ? instr.name : "—"}</td>
                  <td data-label="Mode"><span class="mode-tag ${course?.mode === "Online" ? "online" : "presentiel"}">${course ? course.mode : "—"}</span></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`
    )
    .join("");

  initScrollReveal();
}

/* ---------- Registration page ---------- */
async function initRegistrationPage() {
  const form = document.getElementById("registrationForm");
  if (!form) return;

  const courses = await ApexDB.getCollection("courses");
  const courseSelect = form.elements["courseId"];
  courseSelect.innerHTML =
    `<option value="">General inquiry (no specific course)</option>` +
    courses.map((c) => `<option value="${c.id}">${c.title}</option>`).join("");

  const preselect = getQueryParam("course");
  if (preselect) courseSelect.value = preselect;

  const alertEl = document.getElementById("registrationAlert");
  const submitBtn = form.querySelector('button[type="submit"]');

  setupFormValidation(
    form,
    {
      studentName: (v) => Validate.required(v, "Full name"),
      email: (v) => Validate.email(v),
      phone: (v) => Validate.phone(v, false),
    },
    async (data) => {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      try {
        await ApexDB.addItem("registrations", {
          studentName: data.studentName,
          email: data.email,
          phone: data.phone,
          courseId: courseSelect.value || null,
          notes: form.elements["notes"] ? form.elements["notes"].value.trim() : "",
        });
        showAlert(alertEl, "Registration submitted! We'll confirm your session by email or WhatsApp within 24 hours.", "success");
        submitBtn.disabled = false;
        celebrateSuccess(submitBtn, "Submit Registration");
        form.reset();
      } catch (err) {
        showAlert(alertEl, err.message || "Something went wrong. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Registration";
      }
    }
  );
}

/* ---------- Contact Owner form (homepage + contact page) ---------- */
function initOwnerContactForm() {
  const form = document.getElementById("ownerContactForm");
  if (!form || form.dataset.wired) return;
  form.dataset.wired = "true";

  const alertEl = document.getElementById("ownerContactAlert");
  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultBtnHtml = submitBtn.innerHTML;
  setupFormValidation(
    form,
    {
      ownerName: (v) => Validate.required(v, "Name"),
      ownerEmail: (v) => Validate.email(v),
      ownerMessage: (v) => Validate.minLength(v, 10, "Message"),
    },
    async (data) => {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Sending…";
      try {
        await ApexDB.submitContactOwner({
          name: data.ownerName,
          email: data.ownerEmail,
          message: data.ownerMessage,
        });
        showAlert(alertEl, "Message sent to apex! We'll respond shortly.", "success");
        submitBtn.disabled = false;
        submitBtn.classList.add("btn-success-pulse");
        submitBtn.innerHTML = "✓ Sent";
        setTimeout(() => {
          submitBtn.classList.remove("btn-success-pulse");
          submitBtn.innerHTML = defaultBtnHtml;
        }, 1600);
        form.reset();
      } catch (err) {
        showAlert(alertEl, err.message || "Something went wrong. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultBtnHtml;
      }
    }
  );
}

/* ---------- Contact page ---------- */
async function initContactPage() {
  const infoMount = document.getElementById("contactInfoMount");
  const mapFrame = document.getElementById("contactMap");
  if (!infoMount && !mapFrame) return;

  const info = await ApexDB.getSiteInfo();

  if (infoMount) {
    infoMount.innerHTML = `
      <div class="contact-info-item"><strong>Address</strong><p>${info.address || ""}</p></div>
      <div class="contact-info-item"><strong>Phone</strong><p><a href="tel:${info.phone}">${info.phone}</a></p></div>
      <div class="contact-info-item contact-info-item-last">
        <strong>WhatsApp</strong>
        <p><a href="https://wa.me/${info.whatsapp}" target="_blank" rel="noopener noreferrer">Message on WhatsApp</a></p>
      </div>
    `;
  }
  if (mapFrame && info.mapEmbed) mapFrame.src = info.mapEmbed;
}

/* ---------- FAQ page ---------- */
async function initFaqPage() {
  const mount = document.getElementById("faqMount");
  if (!mount) return;
  const faqs = await ApexDB.getCollection("faqs");

  mount.innerHTML = faqs
    .map(
      (f, i) => `
      <div class="accordion-item reveal-stagger" data-index="${i}">
        <button class="accordion-trigger" aria-expanded="false">
          <span>${f.question}</span>
          <span class="plus">+</span>
        </button>
        <div class="accordion-panel">
          <div class="accordion-panel-inner">${f.answer}</div>
        </div>
      </div>`
    )
    .join("");

  mount.querySelectorAll(".accordion-item").forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      mount.querySelectorAll(".accordion-item.open").forEach((openItem) => {
        openItem.classList.remove("open");
        openItem.querySelector(".accordion-panel").style.maxHeight = null;
        openItem.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  initScrollReveal();
}

/* ---------- Homepage dynamic sections ---------- */
async function renderHomepage() {
  if (document.body.dataset.page !== "home") return;

  const [info, stats, courses, instructors, categories, allTestimonials, announcements] = await Promise.all([
    ApexDB.getSiteInfo(),
    ApexDB.getStats(),
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("categories"),
    ApexDB.getCollection("testimonials"), // public endpoint already filters to approved
    ApexDB.getCollection("announcements"),
  ]);
  const testimonials = allTestimonials;

  // Hero text
  const heroTitle = document.getElementById("heroTitle");
  const heroSubtitle = document.getElementById("heroSubtitle");
  if (heroTitle && info.homepage) heroTitle.textContent = info.homepage.heroTitle;
  if (heroSubtitle && info.homepage) heroSubtitle.textContent = info.homepage.heroSubtitle;

  // Stats
  const statTargets = { statStudents: stats.students, statCourses: stats.courses, statInstructors: stats.instructors, statYears: stats.years };
  Object.entries(statTargets).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.dataset.target = val;
  });

  // Categories — duplicate for infinite marquee when present
  const catRow = document.getElementById("categoryRow");
  if (catRow) {
    const chips = categories
      .map(
        (c) => `<a href="courses.html?category=${c.id}" class="category-chip">
          <span class="chip-icon">${categoryIconSvg(c.icon)}</span> ${c.name}
        </a>`
      )
      .join("");
    const inMarquee = catRow.closest(".marquee");
    catRow.innerHTML = inMarquee ? chips + chips : chips;
  }

  // Featured courses (first 3)
  const featuredGrid = document.getElementById("featuredCourses");
  if (featuredGrid) {
    featuredGrid.innerHTML = courses
      .slice(0, 3)
      .map((c) => courseCardHTML(c, instructors.find((i) => i.id === c.instructorId), categories.find((cat) => cat.id === c.category)))
      .join("");
  }

  // Instructor previews (first 3)
  const instrGrid = document.getElementById("instructorPreview");
  if (instrGrid) {
    instrGrid.innerHTML = instructors.slice(0, 3).map(instructorCardHTML).join("");
  }

  // Testimonials (first 3 approved)
  const testGrid = document.getElementById("testimonialPreview");
  if (testGrid) {
    testGrid.innerHTML = testimonials.length
      ? testimonials.slice(0, 3).map(testimonialCardHTML).join("")
      : `<p class="empty-inline">No testimonials yet — be the first to share your experience.</p>`;
  }

  // Announcement banner (latest)
  const annBanner = document.getElementById("announcementBanner");
  if (annBanner && announcements.length) {
    const latest = announcements[0];
    annBanner.innerHTML = `<strong>${latest.title}</strong> — ${latest.message}`;
    annBanner.style.display = "flex";
  }

  initScrollReveal();
  wireTiltCards(".course-card");
  wireTiltCards(".instructor-card");
  wireMagneticButtons();
  initCounters();
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderHomepage();
  await initInstructorsPage();
  await initSchedulePage();
  await initRegistrationPage();
  await initContactPage();
  initOwnerContactForm();
  await initFaqPage();
  initNewsletter();
  initHeroGlow();
  initHeroBrandParallax();
  initScrollCue();
  initCinemaEngine();
  wireMagneticButtons();
  if (document.body.dataset.page !== "home") initScrollReveal();
});
