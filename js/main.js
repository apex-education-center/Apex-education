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
/** Category list shown across the site, with "Literature" swapped out for
 * "Agenda" and "Informatique" (in French, matching the site's bilingual
 * naming) until those exist as real categories in the database via
 * Admin → Categories. Once real "Agenda"/"Informatique" categories are
 * added there, these virtual placeholders are skipped automatically. */
function getDisplayCategories(categories) {
  const list = (categories || []).filter((c) => !/litt[ée]rature|literature/i.test(c.name || ""));
  const has = (re) => list.some((c) => re.test(c.name || ""));
  const extras = [];
  if (!has(/agenda/i)) extras.push({ id: "__agenda", name: "Agenda", icon: "calendar", __virtual: true });
  if (!has(/informatique/i)) extras.push({ id: "__informatique", name: "Informatique", icon: "laptop", __virtual: true });
  return [...list, ...extras];
}

function categoryIconSvg(name) {
  const icons = {
    calculator: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="19"/><line x1="8" y1="19" x2="12" y2="19"/></svg>`,
    atom: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></svg>`,
    flask: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v6l-6 11a1.5 1.5 0 0 0 1.3 2.2h13.4A1.5 1.5 0 0 0 20 19L14 8V2"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 15-10 0 11-4 17-8 17Z"/><path d="M4 20c4-5 6-7 11-13"/></svg>`,
    book: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><line x1="4" y1="19.5" x2="4" y2="6.5"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>`,
    laptop: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M1 20h22"/><path d="M9 20l1-4h4l1 4"/></svg>`,
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
        ${courseCurriculumBadgesHTML(course)}
        <div class="course-meta">
          <span class="course-price">$${course.price}<span>/hr</span></span>
          <span class="badge badge-teal">${course.level}</span>
        </div>
      </div>
    </a>
  `;
}

/** Bac Libanais/Français and study-language badges for a course (shown on the
 * course card and course details page — set from Admin → Courses). */
/** Small inline icons prefixing each tag-group label (mode / bac / language / location / availability). */
const TAG_ICONS = {
  mode: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg>`,
  bac: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/></svg>`,
  lang: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z"/></svg>`,
  location: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  availability: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
};

function tagGroupHTML(iconKey, label, innerHTML) {
  return `<div class="tag-group tag-group-${iconKey}"><span class="tag-label"><span class="tag-icon">${TAG_ICONS[iconKey]}</span>${label}</span>${innerHTML}</div>`;
}

function courseCurriculumBadgesHTML(course) {
  const bac = course.bac || [];
  const langs = course.languages || [];
  if (!bac.length && !langs.length) return "";
  const bacBadges = bac.map((b) => `<span class="badge badge-bac">${b === "libanais" ? "Bac Libanais" : "Bac Français"}</span>`).join("");
  const langBadges = langs.map((l) => `<span class="badge badge-lang">${l === "english" ? "English" : "Français"}</span>`).join("");
  let html = "";
  if (bacBadges) html += tagGroupHTML("bac", "Bac", `<div class="instructor-tags">${bacBadges}</div>`);
  if (langBadges) html += tagGroupHTML("lang", "Language of study", `<div class="instructor-tags">${langBadges}</div>`);
  return html;
}

/** Human-readable labels for an instructor's teaching mode(s), Bac system(s), and teaching language(s). */
function instructorTagsHTML(instructor) {
  const modes = instructor.modes && instructor.modes.length ? instructor.modes : (instructor.mode ? [instructor.mode.toLowerCase()] : []);
  const bac = instructor.bac || [];
  const langs = instructor.teachingLanguages || [];

  const modeBadges = modes
    .map((m) => (m === "online" ? `<span class="badge badge-teal">Online</span>` : `<span class="badge badge-accent">Présentiel</span>`))
    .join("");
  const bacBadges = bac
    .map((b) => `<span class="badge badge-bac">${b === "libanais" ? "Bac Libanais" : "Bac Français"}</span>`)
    .join("");
  const langBadges = langs
    .map((l) => `<span class="badge badge-lang">${l === "english" ? "English" : "Français"}</span>`)
    .join("");

  let html = "";
  if (modeBadges) html += tagGroupHTML("mode", "Mode", `<div class="instructor-tags">${modeBadges}</div>`);
  if (bacBadges) html += tagGroupHTML("bac", "Bac", `<div class="instructor-tags">${bacBadges}</div>`);
  if (langBadges) html += tagGroupHTML("lang", "Language of study", `<div class="instructor-tags">${langBadges}</div>`);
  return html;
}


function instructorCardHTML(instructor) {
  const bg = instructor.photo ? `background-image:url('${instructor.photo}');` : "";
  return `
    <div class="instructor-card reveal-stagger">
      <div class="instructor-avatar" style="${bg}">${instructor.photo ? "" : initials(instructor.name)}</div>
      <h3>${instructor.name}</h3>
      <p class="instructor-subject">${instructor.subject}</p>
      ${instructorTagsHTML(instructor)}
      ${instructor.location ? tagGroupHTML("location", "Location", `<p class="instructor-location">${instructor.location}</p>`) : ""}
      <p class="bio">${instructor.bio}</p>
      ${instructor.availability ? tagGroupHTML("availability", "Availability", `<p class="instructor-availability">${instructor.availability}</p>`) : ""}
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
/** Custom mouse cursor effect for desktop/laptop pointers — a glowing dot
 * with a soft trailing ring that reacts to interactive elements. Skipped on
 * touch devices and when the user prefers reduced motion. */
function initCursorFX() {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.getElementById("cursorFxDot")) return;

  const dot = document.createElement("div");
  dot.id = "cursorFxDot";
  dot.className = "cursor-fx-dot";
  const ring = document.createElement("div");
  ring.id = "cursorFxRing";
  ring.className = "cursor-fx-ring";
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let active = false;

  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      if (!active) {
        active = true;
        document.body.classList.add("cursor-fx-active");
      }
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-fx-active"));
  document.addEventListener("mouseenter", () => document.body.classList.add("cursor-fx-active"));

  function loop() {
    // Smooth trailing lag for the outer ring
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const interactiveSelector = 'a, button, .btn, input, textarea, select, .portal-card, .course-card, .instructor-card, .filter-btn, [role="button"]';
  document.addEventListener(
    "mouseover",
    (e) => {
      if (e.target.closest && e.target.closest(interactiveSelector)) {
        document.body.classList.add("cursor-fx-hover");
      }
    },
    { passive: true }
  );
  document.addEventListener(
    "mouseout",
    (e) => {
      if (e.target.closest && e.target.closest(interactiveSelector) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(interactiveSelector))) {
        document.body.classList.remove("cursor-fx-hover");
      }
    },
    { passive: true }
  );
}

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
    wireTiltCards(".portal-card");

    const mounts = document.querySelectorAll("#coursesGrid, #instructorsGrid, #faqMount");
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

  // Fetch everything independently so one failing endpoint (e.g. a backend
  // hiccup) can't stop the whole homepage — including the reveal/animation
  // code below — from running. Each piece degrades gracefully on its own.
  const [infoR, statsR, coursesR, instructorsR, categoriesR, testimonialsR, announcementsR] = await Promise.allSettled([
    ApexDB.getSiteInfo(),
    ApexDB.getStats(),
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("categories"),
    ApexDB.getCollection("testimonials"),
    ApexDB.getCollection("announcements"),
  ]);
  const settle = (r, fallback) => (r.status === "fulfilled" ? r.value : fallback);
  const info = settle(infoR, {});
  const stats = settle(statsR, {});
  const courses = settle(coursesR, []);
  const instructors = settle(instructorsR, []);
  const categories = settle(categoriesR, []);
  const testimonials = settle(testimonialsR, []);
  const announcements = settle(announcementsR, []);
  [infoR, statsR, coursesR, instructorsR, categoriesR, testimonialsR, announcementsR].forEach((r) => {
    if (r.status === "rejected") console.error("Homepage data fetch failed:", r.reason);
  });

  try {
    // Hero text
    const heroTitle = document.getElementById("heroTitle");
    const heroSubtitle = document.getElementById("heroSubtitle");
    if (heroTitle && info.homepage) heroTitle.textContent = info.homepage.heroTitle;
    if (heroSubtitle && info.homepage) heroSubtitle.textContent = info.homepage.heroSubtitle;

    // Stats
    const statTargets = { statStudents: stats.students, statCourses: stats.courses, statInstructors: stats.instructors, statYears: stats.years };
    Object.entries(statTargets).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val != null) el.dataset.target = val;
    });

    // Categories — duplicate for infinite marquee when present
    const catRow = document.getElementById("categoryRow");
    if (catRow) {
      const displayCategories = getDisplayCategories(categories);
      const chips = displayCategories
        .map(
          (c) => `<a href="courses.html?category=${c.id}" class="category-chip">
            <span class="chip-icon">${categoryIconSvg(c.icon)}</span> ${c.name}
          </a>`
        )
        .join("");
      const inMarquee = catRow.closest(".marquee");
      catRow.innerHTML = inMarquee ? chips + chips : chips;
    }

    // Explore portals — animated buttons replacing the old static grids
    const portalCourses = document.getElementById("portalCoursesCount");
    if (portalCourses) portalCourses.textContent = courses.length;
    const portalInstructors = document.getElementById("portalInstructorsCount");
    if (portalInstructors) portalInstructors.textContent = instructors.length;
    const portalTestimonials = document.getElementById("portalTestimonialsCount");
    if (portalTestimonials) portalTestimonials.textContent = testimonials.length;

    // Announcement banner (latest)
    const annBanner = document.getElementById("announcementBanner");
    if (annBanner && announcements.length) {
      const latest = announcements[0];
      annBanner.innerHTML = `<strong>${latest.title}</strong> — ${latest.message}`;
      annBanner.style.display = "flex";
    }
  } catch (err) {
    console.error("Error populating homepage content:", err);
  } finally {
    // Always run — even if some data above failed to load, the page (and
    // the portal cards) must still fade in instead of staying invisible.
    initScrollReveal();
    wireTiltCards(".portal-card");
    wireMagneticButtons();
    initCounters();
  }
}

/** Runs an init function without letting a failure block the ones after it. */
async function safeInit(fn, label) {
  try {
    await fn();
  } catch (err) {
    console.error(`Error in ${label || fn.name}:`, err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await safeInit(renderHomepage, "renderHomepage");
  await safeInit(initInstructorsPage, "initInstructorsPage");
  await safeInit(initRegistrationPage, "initRegistrationPage");
  await safeInit(initContactPage, "initContactPage");
  await safeInit(initOwnerContactForm, "initOwnerContactForm");
  await safeInit(initFaqPage, "initFaqPage");
  await safeInit(initNewsletter, "initNewsletter");
  await safeInit(initHeroGlow, "initHeroGlow");
  await safeInit(initHeroBrandParallax, "initHeroBrandParallax");
  await safeInit(initScrollCue, "initScrollCue");
  await safeInit(initCinemaEngine, "initCinemaEngine");
  await safeInit(initCursorFX, "initCursorFX");
  wireMagneticButtons();
  if (document.body.dataset.page !== "home") initScrollReveal();
});
