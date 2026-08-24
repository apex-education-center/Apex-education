/**
 * courses.js
 * Powers courses.html (search + filter grid) and course-details.html
 * (single course view, read from a ?id= query param).
 */

/* getQueryParam is defined in main.js, loaded before this file on every page that includes it */

/* ---------- Courses listing page ---------- */
async function initCoursesPage() {
  const grid = document.getElementById("coursesGrid");
  if (!grid) return;

  const [courses, instructors, categories] = await Promise.all([
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("categories"),
  ]);

  const searchInput = document.getElementById("courseSearch");
  const categoryFilterBar = document.getElementById("categoryFilterBar");
  const modeFilterBar = document.getElementById("modeFilterBar");
  const languageFilterBar = document.getElementById("languageFilterBar");
  const bacFilterBar = document.getElementById("bacFilterBarCourses");
  const priceSort = document.getElementById("priceSort");
  const emptyState = document.getElementById("coursesEmpty");
  const resultCount = document.getElementById("resultCount");

  let state = {
    search: "",
    category: getQueryParam("category") || "all",
    mode: "all",
    language: "all",
    bac: "all",
    instructor: getQueryParam("instructor") || null,
    sort: "default",
    priceMin: null,
    priceMax: null,
  };

  const prices = courses.map((c) => Number(c.price) || 0);
  const priceFloor = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceCeil = prices.length ? Math.ceil(Math.max(...prices)) : 100;
  initDualRangeSlider({
    idPrefix: "price",
    min: priceFloor,
    max: priceCeil,
    step: 1,
    formatLabel: (v) => `$${v}`,
    onChange: (minVal, maxVal) => {
      state.priceMin = minVal;
      state.priceMax = maxVal;
      render();
    },
  });
  state.priceMin = priceFloor;
  state.priceMax = priceCeil;

  // Build category filter chips (Literature swapped for Agenda/Informatique
  // via getDisplayCategories, defined in main.js)
  const displayCategories = getDisplayCategories(categories);
  categoryFilterBar.innerHTML =
    `<button class="filter-btn ${state.category === "all" ? "active" : ""}" data-cat="all">All Subjects</button>` +
    displayCategories
      .map((c) => `<button class="filter-btn ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`)
      .join("");

  categoryFilterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    state.category = btn.dataset.cat;
    categoryFilterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  modeFilterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    state.mode = btn.dataset.mode;
    modeFilterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  if (languageFilterBar) {
    languageFilterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      state.language = btn.dataset.language;
      languageFilterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  }

  if (bacFilterBar) {
    bacFilterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      state.bac = btn.dataset.bac;
      bacFilterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  }

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim().toLowerCase();
    render();
  });

  if (priceSort) {
    priceSort.addEventListener("change", () => {
      state.sort = priceSort.value;
      render();
    });
  }

  function render() {
    let filtered = courses.filter((c) => {
      const matchesSearch = !state.search || c.title.toLowerCase().includes(state.search) || c.shortDesc.toLowerCase().includes(state.search);
      const matchesCategory = state.category === "all" || c.category === state.category;
      const matchesMode = state.mode === "all" || c.mode.toLowerCase() === state.mode;
      const matchesLanguage = state.language === "all" || (c.languages || []).includes(state.language);
      const matchesBac = state.bac === "all" || (c.bac || []).includes(state.bac);
      const matchesInstructor = !state.instructor || c.instructorId === state.instructor;
      const price = Number(c.price) || 0;
      const matchesMin = state.priceMin == null || price >= state.priceMin;
      const matchesMax = state.priceMax == null || price <= state.priceMax;
      return matchesSearch && matchesCategory && matchesMode && matchesLanguage && matchesBac && matchesInstructor && matchesMin && matchesMax;
    });

    if (state.sort === "price-asc") filtered = filtered.slice().sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (state.sort === "price-desc") filtered = filtered.slice().sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

    resultCount.textContent = `${filtered.length} course${filtered.length === 1 ? "" : "s"} found`;

    if (!filtered.length) {
      grid.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    grid.innerHTML = filtered
      .map((c) => courseCardHTML(c, instructors.find((i) => i.id === c.instructorId), categories.find((cat) => cat.id === c.category)))
      .join("");
    initScrollReveal();
    wireTiltCards(".course-card");
  }

  render();
}

/* ---------- Course details page ---------- */
async function initCourseDetailsPage() {
  const mount = document.getElementById("courseDetailMount");
  if (!mount) return;

  const id = getQueryParam("id");
  const [courses, instructors, categories] = await Promise.all([
    ApexDB.getCollection("courses"),
    ApexDB.getCollection("instructors"),
    ApexDB.getCollection("categories"),
  ]);
  const course = courses.find((c) => c.id === id);

  if (!course) {
    mount.innerHTML = `
      <div class="empty-state">
        <h2>Course not found</h2>
        <p>This course may have been removed. Browse all available courses instead.</p>
        <a href="courses.html" class="btn btn-primary mt-lg">Browse Courses</a>
      </div>`;
    return;
  }

  const instructor = instructors.find((i) => i.id === course.instructorId);
  const category = categories.find((c) => c.id === course.category);

  document.title = `${course.title} — Apex Education Center`;

  mount.innerHTML = `
    <div class="grid-2">
      <div>
        <span class="eyebrow reveal-stagger">${category ? category.name : ""}</span>
        <h1 class="reveal-stagger">${course.title}</h1>
        <p class="lead reveal-stagger">${course.fullDesc}</p>
        <div class="hero-actions reveal-stagger">
          <a href="registration.html?course=${course.id}" class="btn btn-accent btn-lg btn-magnetic">Register for this Course</a>
          <a href="courses.html" class="btn btn-outline btn-lg">Back to Courses</a>
        </div>
      </div>
      <div class="hero-visual reveal" style="${course.image ? `background-image:url('${course.image}');background-size:cover;` : ""}">
        ${course.image ? "" : railGraphicHTML()}
      </div>
    </div>

    <div class="course-detail-meta mt-lg reveal">
      <span class="badge badge-accent">${course.level}</span>
      <span class="badge badge-teal">${course.mode}</span>
      <span class="badge badge-teal">${course.duration}</span>
      <span class="course-price" style="font-size:1.3rem;">$${course.price}<span>/hr</span></span>
    </div>
    ${typeof courseCurriculumBadgesHTML === "function" ? courseCurriculumBadgesHTML(course) : ""}

    <div class="grid-2 mt-lg" style="align-items:start;">
      <div class="reveal">
        <h2 style="font-size:1.5rem;">Syllabus</h2>
        <ul class="syllabus-list">
          ${course.syllabus.map((s, i) => `<li><span class="syllabus-num">${String(i + 1).padStart(2, "0")}</span>${s}</li>`).join("")}
        </ul>
      </div>

      ${
        instructor
          ? `<div class="instructor-card reveal">
              ${typeof nationalityBadgeHTML === "function" ? nationalityBadgeHTML(instructor) : ""}
              <div class="instructor-avatar-wrap">
                <div class="instructor-avatar" style="${instructor.photo ? `background-image:url('${instructor.photo}');` : ""}">${instructor.photo ? "" : initials(instructor.name)}</div>
              </div>
              <h3>${instructor.name}</h3>
              <p class="instructor-subject">${instructor.subject}</p>
              ${typeof instructorTagsHTML === "function" ? instructorTagsHTML(instructor) : ""}
              ${instructor.location ? tagGroupHTML("location", "Location", `<p class="instructor-location">${instructor.location}</p>`) : ""}
              ${instructor.bio ? tagGroupHTML("about", "About", `<p class="bio">${instructor.bio}</p>`) : ""}
              ${instructor.availability ? tagGroupHTML("availability", "Availability", `<p class="instructor-availability">${instructor.availability}</p>`) : ""}
              <p class="instructor-exp">${instructor.experience} experience</p>
              <a href="instructors.html" class="btn btn-outline btn-sm">All Instructors</a>
            </div>`
          : ""
      }
    </div>
  `;

  initScrollReveal();
  if (typeof wireMagneticButtons === "function") wireMagneticButtons();
  if (typeof wireTiltCards === "function") wireTiltCards(".instructor-card");
}

function railGraphicHTML() {
  return `
    <svg class="rail-graphic" viewBox="0 0 300 120" fill="none">
      <line x1="10" y1="60" x2="290" y2="60" stroke="rgba(255,255,255,0.28)" stroke-width="1.5" stroke-dasharray="1 9"/>
      ${[30, 90, 150, 210, 270]
        .map((x, i) => `<circle cx="${x}" cy="${60 - i * 8}" r="${i === 4 ? 10 : 6}" fill="${i === 4 ? "#FFB238" : "rgba(255,255,255,0.4)"}"/>`)
        .join("")}
    </svg>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  await initCoursesPage();
  await initCourseDetailsPage();
});
