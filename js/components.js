/**
 * components.js
 * Injects the shared site header and footer into every page, and wires up
 * the behaviors that go with them: mobile menu, sticky nav shadow,
 * scroll-to-top button, active-link highlighting, and smooth scrolling.
 * Each HTML page just needs <div id="site-header"></div> and
 * <div id="site-footer"></div> placeholders.
 */

const NAV_LINKS = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "about.html", label: "About", page: "about" },
  { href: "courses.html", label: "Courses", page: "courses" },
  { href: "instructors.html", label: "Instructors", page: "instructors" },
  { href: "faq.html", label: "FAQ", page: "faq" },
  { href: "contact.html#contact-owner", label: "Contact Owner", page: "contact" },
];

/* ---------- Language / translate switcher ----------
   Uses Google's free website-translate widget under the hood, but is
   presented as a small branded dropdown instead of Google's default bar.
   No API key required. Pierre can add/remove languages by editing
   TRANSLATE_LANGUAGES below. */
const TRANSLATE_LANGUAGES = [
  {
    code: "en",
    label: "English",
    flag: `<svg viewBox="0 0 60 36" width="20" height="13"><rect width="60" height="36" fill="#00247d"/><path d="M0,0 60,36M60,0 0,36" stroke="#fff" stroke-width="6"/><path d="M0,0 60,36M60,0 0,36" stroke="#cf142b" stroke-width="2"/><path d="M30,0 30,36M0,18 60,18" stroke="#fff" stroke-width="10"/><path d="M30,0 30,36M0,18 60,18" stroke="#cf142b" stroke-width="6"/></svg>`,
  },
  {
    code: "fr",
    label: "Français",
    flag: `<svg viewBox="0 0 3 2" width="20" height="13"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#FFFFFF"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`,
  },
  {
    code: "ar",
    label: "العربية",
    flag: `<svg viewBox="0 0 3 2" width="20" height="13"><rect width="3" height="2" fill="#ED1C24"/><rect y="0.5" width="3" height="1" fill="#fff"/><path d="M1.5,0.68 1.66,1.08 2.08,1.08 1.74,1.3 1.87,1.68 1.5,1.44 1.13,1.68 1.26,1.3 0.92,1.08 1.34,1.08Z" fill="#00A651"/></svg>`,
  },
];

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function setGoogleTranslateCookie(langCode) {
  // googtrans cookie format: /<from>/<to> ; "" (or "en") means "show original"
  const value = langCode === "en" ? "/en/en" : `/en/${langCode}`;
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`;
}

function initLanguageSwitcher() {
  const mount = document.getElementById("langSwitcher");
  if (!mount) return;

  const current = (getCookie("googtrans").split("/")[2] || "en");
  const currentLang = TRANSLATE_LANGUAGES.find((l) => l.code === current) || TRANSLATE_LANGUAGES[0];

  mount.innerHTML = `
    <button class="lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false" aria-label="Change language">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z"/></svg>
      <span id="langBtnLabel">${currentLang.code.toUpperCase()}</span>
    </button>
    <div class="lang-menu" id="langMenu" role="menu">
      ${TRANSLATE_LANGUAGES.map(
        (l) => `<button class="lang-option ${l.code === currentLang.code ? "active" : ""}" role="menuitem" data-lang="${l.code}">
          <span class="lang-flag">${l.flag}</span> ${l.label}
        </button>`
      ).join("")}
    </div>
    <div id="google_translate_element" style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;"></div>
  `;

  const btn = document.getElementById("langBtn");
  const menu = document.getElementById("langMenu");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  menu.querySelectorAll(".lang-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const lang = opt.dataset.lang;
      setGoogleTranslateCookie(lang);
      window.location.reload();
    });
  });

  // Load the Google Translate script once per page, only if a non-English
  // language is active (keeps things snappy for the default English view).
  if (currentLang.code !== "en" && !window.__apexTranslateLoaded) {
    window.__apexTranslateLoaded = true;
    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: TRANSLATE_LANGUAGES.map((l) => l.code).join(","), autoDisplay: false },
        "google_translate_element"
      );
    };
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }
}

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const current = document.body.dataset.page || "";

  mount.innerHTML = `
    <header class="site-header" id="siteHeader">
      <div class="header-inner">
        <a href="index.html" class="brand" aria-label="Apex Education Center home">
          <span class="brand-mark" aria-hidden="true">
            <img src="assets/images/logo.png" alt="" />
          </span>
          <span class="brand-text"><span class="notranslate" translate="no">Apex</span><span class="brand-sub">Education Center</span></span>
        </a>

        <nav class="main-nav" id="mainNav" aria-label="Main navigation">
          <ul>
            ${NAV_LINKS.map(
              (l) => `<li><a href="${l.href}" class="${l.page === current ? "active" : ""}">${l.label}</a></li>`
            ).join("")}
            <li class="nav-mobile-cta">
              <a href="registration.html" class="btn btn-accent btn-block">Register</a>
            </li>
          </ul>
        </nav>

        <div class="header-actions">
          <div class="lang-switcher notranslate" id="langSwitcher" translate="no"></div>
          <a href="registration.html" class="btn btn-accent btn-sm btn-magnetic header-register">Register</a>
          <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  `;
}

async function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  const info = (typeof ApexDB !== "undefined" && (await ApexDB.getSiteInfo())) || {};
  const social = info.social || {};

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div style="display:flex;align-items:center;gap:11px;margin-bottom:4px;">
            <span class="brand-mark" aria-hidden="true"><img src="assets/images/logo.png" alt="" /></span>
            <span class="brand-text light"><span class="notranslate" translate="no">Apex</span><span class="brand-sub">Education Center</span></span>
          </div>
          <p>${info.tagline || "Private tutoring, elevated."}</p>
          <div class="social-links">
            ${social.facebook ? `<a href="${social.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook">${iconSvg("facebook")}</a>` : ""}
            ${social.instagram ? `<a href="${social.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${iconSvg("instagram")}</a>` : ""}
            ${info.whatsapp ? `<a href="https://wa.me/${info.whatsapp}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${iconSvg("whatsapp")}</a>` : ""}
          </div>
        </div>

        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="courses.html">Courses</a></li>
            <li><a href="instructors.html">Instructors</a></li>
            <li><a href="feedback.html">Testimonials</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html#contact-owner">Contact Owner</a></li>
            <li><a href="registration.html">Register</a></li>
            <li><a href="admin.html">Admin</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Get in Touch</h4>
          <ul class="footer-contact">
            <li>${info.address || ""}</li>
            <li><a href="mailto:${info.email || ""}">${info.email || ""}</a></li>
            <li><a href="tel:${info.phone || ""}">${info.phone || ""}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>&copy; ${new Date().getFullYear()} <span class="notranslate" translate="no">Apex Education Center</span>. All rights reserved.</p>
          <button id="scrollTopBtn" class="scroll-top" aria-label="Scroll to top">${iconSvg("arrow-up")}</button>
        </div>
      </div>
    </footer>
  `;

  wireScrollTop();
}

function iconSvg(name) {
  const icons = {
    facebook: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13.5 21v-7.5H16l.5-3.5h-3V7.8c0-1 .3-1.7 1.7-1.7H16.6V3.1C16.2 3 15.2 3 14 3c-2.6 0-4.4 1.6-4.4 4.5v2.5H7v3.5h2.6V21h3.9z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.2c2.7 0 3 0 4.1.06 1.1.05 1.8.22 2.2.36.6.23 1 .5 1.4.9.4.4.7.9.9 1.4.15.4.3 1.1.36 2.2.06 1.2.06 1.5.06 4.1s0 3-.06 4.1c-.05 1.1-.22 1.8-.36 2.2a4 4 0 0 1-.9 1.4 4 4 0 0 1-1.4.9c-.4.15-1.1.3-2.2.36-1.2.06-1.5.06-4.1.06s-3 0-4.1-.06c-1.1-.05-1.8-.22-2.2-.36a4 4 0 0 1-1.4-.9 4 4 0 0 1-.9-1.4c-.15-.4-.3-1.1-.36-2.2C2.2 15 2.2 14.7 2.2 12s0-3 .06-4.1c.05-1.1.22-1.8.36-2.2.23-.6.5-1 .9-1.4.4-.4.9-.7 1.4-.9.4-.15 1.1-.3 2.2-.36C8.2 2.2 8.5 2.2 12 2.2Zm0 1.8c-2.6 0-2.9 0-3.9.06-.9.04-1.4.18-1.7.3-.4.16-.7.35-1 .65-.3.3-.5.6-.65 1-.12.3-.26.8-.3 1.7C4.4 9.1 4.4 9.4 4.4 12s0 2.9.06 3.9c.04.9.18 1.4.3 1.7.16.4.35.7.65 1 .3.3.6.5 1 .65.3.12.8.26 1.7.3 1 .06 1.3.06 3.9.06s2.9 0 3.9-.06c.9-.04 1.4-.18 1.7-.3.4-.16.7-.35 1-.65.3-.3.5-.6.65-1 .12-.3.26-.8.3-1.7.06-1 .06-1.3.06-3.9s0-2.9-.06-3.9c-.04-.9-.18-1.4-.3-1.7a2.6 2.6 0 0 0-.65-1 2.6 2.6 0 0 0-1-.65c-.3-.12-.8-.26-1.7-.3-1-.06-1.3-.06-3.9-.06Zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm4.8-2a1.08 1.08 0 1 1 0 2.16 1.08 1.08 0 0 1 0-2.16Z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.94-.27-.1-.46-.15-.65.15-.2.3-.75.94-.9 1.13-.17.2-.34.22-.63.08-.3-.15-1.24-.46-2.35-1.46-.87-.78-1.46-1.73-1.63-2.03-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.65-1.58-.9-2.16-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.5.07-.77.37s-1.02 1-1.02 2.44 1.05 2.83 1.2 3.03c.15.2 2.06 3.15 5 4.4.7.3 1.24.48 1.67.6.7.23 1.34.2 1.84.12.56-.08 1.7-.7 1.95-1.36.24-.67.24-1.24.17-1.36-.07-.13-.26-.2-.55-.35Z"/><path d="M12 2.4A9.6 9.6 0 0 0 3.9 17.4L2.4 21.6l4.3-1.4A9.6 9.6 0 1 0 12 2.4Zm0 1.8a7.8 7.8 0 0 1 6.6 12.03l-.24.38.3 1-1.03-.3-.37.22A7.8 7.8 0 1 1 12 4.2Z"/></svg>`,
    "arrow-up": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  };
  return icons[name] || "";
}

/** Single Contact Owner UI — compact promo on home, full form on contact page. */
function renderContactOwner() {
  const mount = document.getElementById("contactOwnerMount");
  if (!mount) return;

  const compact = mount.dataset.variant === "compact";

  if (compact) {
    mount.innerHTML = `
      <section class="contact-promo reveal" aria-labelledby="contactPromoTitle">
        <div class="contact-promo-inner glass-panel">
          <div class="contact-promo-copy">
            <span class="eyebrow">Direct line</span>
            <h2 id="contactPromoTitle">Message <span class="notranslate" translate="no">apex</span> directly</h2>
            <p>Enrollment, scheduling, or partnerships — one form, routed to the owner.</p>
          </div>
          <a href="contact.html#contact-owner" class="btn btn-accent btn-lg btn-magnetic">Contact Owner</a>
        </div>
      </section>
    `;
    return;
  }

  mount.innerHTML = `
    <section id="contact-owner" class="contact-owner-section reveal" aria-labelledby="contactOwnerTitle">
      <div class="contact-owner-ambient" aria-hidden="true"></div>
      <div class="contact-owner-inner">
        <header class="contact-owner-head">
          <span class="eyebrow eyebrow-on-dark">Owner inbox</span>
          <h1 id="contactOwnerTitle">Contact Owner</h1>
          <p>Send a message — delivered directly to <strong class="notranslate" translate="no">apex</strong>. Response within one business day.</p>
        </header>
        <div class="contact-owner-form-wrap">
          <div class="alert" id="ownerContactAlert"></div>
          <form id="ownerContactForm" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="ownerName">Name</label>
                <input type="text" id="ownerName" name="ownerName" placeholder="Full name" autocomplete="name" />
                <span class="field-error" data-error-for="ownerName"></span>
              </div>
              <div class="form-group">
                <label for="ownerEmail">Email</label>
                <input type="email" id="ownerEmail" name="ownerEmail" placeholder="you@example.com" autocomplete="email" />
                <span class="field-error" data-error-for="ownerEmail"></span>
              </div>
            </div>
            <div class="form-group">
              <label for="ownerMessage">Message</label>
              <textarea id="ownerMessage" name="ownerMessage" rows="5" placeholder="How can we help?"></textarea>
              <span class="field-error" data-error-for="ownerMessage"></span>
            </div>
            <button type="submit" class="btn btn-contact-owner btn-lg btn-magnetic">
              Send to <span class="notranslate" translate="no">apex</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function wireMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  let backdrop = document.getElementById("navBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "navBackdrop";
    backdrop.className = "nav-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
  }

  const close = () => {
    nav.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    backdrop.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  backdrop.addEventListener("click", close);
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

function wireStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function wireScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("visible", window.scrollY > 500);
  document.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  onScroll();
}

async function initLayout() {
  // Reveal the page first — if anything below throws, the user still sees
  // content instead of a permanently blank screen.
  document.body.classList.add("loaded");
  try {
    if (typeof ApexDB !== "undefined") {
      await ApexDB.seedIfEmpty();
    }
    renderHeader();
    renderContactOwner();
    await renderFooter();
    wireMobileNav();
    wireStickyHeader();
    initLanguageSwitcher();
    if (typeof wireMagneticButtons === "function") wireMagneticButtons();
  } catch (err) {
    console.error("Error initializing page layout:", err);
  }
}

document.addEventListener("DOMContentLoaded", initLayout);
