/**
 * storage.js
 * Real backend client. Every function talks to the Express API in
 * /server (which talks to Postgres, Resend, and Google Calendar) instead
 * of localStorage. Every function here is now async — every call site
 * across the site awaits it.
 */

const ApexDB = (() => {
  const COLLECTION_ENDPOINTS = {
    courses: "/api/courses",
    instructors: "/api/instructors",
    schedule: "/api/schedule",
    categories: "/api/categories",
    testimonials: "/api/testimonials",
    announcements: "/api/announcements",
    faqs: "/api/faqs",
    registrations: "/api/registrations",
    newsletter: "/api/newsletter",
  };

  async function request(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "same-origin",
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      // no JSON body (e.g. 204) — fine
    }
    if (!res.ok) {
      throw new Error(body?.error || `Request failed (${res.status})`);
    }
    return body;
  }

  // No-op kept so every page's existing `await ApexDB.seedIfEmpty()` call
  // still works without editing every call site — data now lives in
  // Postgres and is seeded once via `npm run seed` in /server, not per-page.
  async function seedIfEmpty() {
    return true;
  }

  async function getCollection(key, options = {}) {
    const base = COLLECTION_ENDPOINTS[key];
    if (!base) throw new Error(`Unknown collection: ${key}`);
    const query = options.all ? "?all=true" : "";
    return request(base + query);
  }

  async function addItem(key, item) {
    const base = COLLECTION_ENDPOINTS[key];
    if (!base) throw new Error(`Unknown collection: ${key}`);
    return request(base, { method: "POST", body: JSON.stringify(item) });
  }

  async function updateItem(key, id, patch) {
    const base = COLLECTION_ENDPOINTS[key];
    if (!base) throw new Error(`Unknown collection: ${key}`);
    return request(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function deleteItem(key, id) {
    const base = COLLECTION_ENDPOINTS[key];
    if (!base) throw new Error(`Unknown collection: ${key}`);
    return request(`${base}/${id}`, { method: "DELETE" });
  }

  async function getSiteInfo() {
    return request("/api/site-info");
  }

  async function updateSiteInfo(patch) {
    return request("/api/site-info", { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function updateHomepage(patch) {
    const info = await getSiteInfo();
    const homepage = { ...(info.homepage || {}), ...patch };
    return updateSiteInfo({ homepage });
  }

  async function getStats() {
    return request("/api/stats");
  }

  async function updateStats(patch) {
    return request("/api/stats", { method: "PATCH", body: JSON.stringify(patch) });
  }

  // ---- Registrations: real meeting scheduling ----
  async function confirmRegistration(id, meetingTime, durationMinutes = 60) {
    return request(`/api/registrations/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ meetingTime, durationMinutes }),
    });
  }

  async function declineRegistration(id) {
    return request(`/api/registrations/${id}/decline`, { method: "POST" });
  }

  // ---- Contact / newsletter ----
  async function submitContact(data) {
    return request("/api/contact", { method: "POST", body: JSON.stringify(data) });
  }

  async function submitContactOwner(data) {
    return request("/api/contact-owner", { method: "POST", body: JSON.stringify(data) });
  }

  async function subscribeNewsletter(email, phone = "") {
    return request("/api/newsletter", { method: "POST", body: JSON.stringify({ email, phone }) });
  }

  // ---- Admin auth ----
  async function adminLogin(password) {
    return request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
  }

  async function adminLogout() {
    return request("/api/admin/logout", { method: "POST" });
  }

  async function adminChangePassword(currentPassword, newPassword) {
    return request("/api/admin/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  }

  async function getGoogleStatus() {
    return request("/api/admin/google-status");
  }

  return {
    seedIfEmpty,
    getCollection,
    addItem,
    updateItem,
    deleteItem,
    getSiteInfo,
    updateSiteInfo,
    updateHomepage,
    getStats,
    updateStats,
    confirmRegistration,
    declineRegistration,
    submitContact,
    submitContactOwner,
    subscribeNewsletter,
    adminLogin,
    adminLogout,
    adminChangePassword,
    getGoogleStatus,
  };
})();
