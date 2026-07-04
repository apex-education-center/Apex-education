/**
 * validation.js
 * Small, dependency-free validation helpers shared across every form on
 * the site. Each validator returns an error string, or "" if the value
 * is valid — callers decide how/where to display it.
 */

const Validate = {
  required(value, label = "This field") {
    return value && value.trim() ? "" : `${label} is required.`;
  },
  email(value) {
    if (!value.trim()) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) ? "" : "Enter a valid email address.";
  },
  phone(value, required = false) {
    if (!value.trim()) return required ? "Phone number is required." : "";
    const re = /^[+\d][\d\s-]{6,}$/;
    return re.test(value) ? "" : "Enter a valid phone number.";
  },
  minLength(value, min, label = "This field") {
    return value && value.trim().length >= min ? "" : `${label} must be at least ${min} characters.`;
  },
  select(value, label = "This field") {
    return value ? "" : `Please choose ${label}.`;
  },
};

/**
 * Wires a form for live + submit-time validation.
 * fieldRules: { inputName: (value) => errorString }
 * onValid: called with a FormData-derived plain object when the form passes.
 */
function setupFormValidation(form, fieldRules, onValid) {
  if (!form) return;

  function validateField(name) {
    const input = form.elements[name];
    const rule = fieldRules[name];
    if (!input || !rule) return true;
    const error = rule(input.value);
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = error;
    input.classList.toggle("invalid", Boolean(error));
    return !error;
  }

  Object.keys(fieldRules).forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener("blur", () => validateField(name));
    input.addEventListener("input", () => {
      if (input.classList.contains("invalid")) validateField(name);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const allValid = Object.keys(fieldRules)
      .map(validateField)
      .every(Boolean);

    if (!allValid) {
      const firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = {};
    Object.keys(fieldRules).forEach((name) => {
      data[name] = form.elements[name].value.trim();
    });
    onValid(data, form);
  });
}

function showAlert(el, message, type = "success") {
  if (!el) return;
  el.textContent = message;
  el.className = `alert show alert-${type}`;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Briefly pulses a button green with a checkmark to celebrate a successful submit, then restores restoreLabel. */
function celebrateSuccess(btn, restoreLabel) {
  if (!btn) return;
  btn.classList.add("btn-success-pulse");
  btn.textContent = "✓ Done";
  setTimeout(() => {
    btn.classList.remove("btn-success-pulse");
    btn.textContent = restoreLabel;
  }, 1600);
}
