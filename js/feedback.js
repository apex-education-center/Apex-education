/**
 * feedback.js
 * Powers feedback.html: an interactive star-rating widget, the submission
 * form (new testimonials start unapproved until an admin reviews them),
 * and the list of already-approved testimonials.
 */

function initStarRatingWidget() {
  const widget = document.getElementById("starRatingInput");
  const hiddenInput = document.getElementById("ratingValue");
  if (!widget || !hiddenInput) return;

  let current = 0;
  widget.innerHTML = [1, 2, 3, 4, 5]
    .map((i) => `<button type="button" class="star-btn" data-val="${i}" aria-label="${i} star${i > 1 ? "s" : ""}">${starIconSvg(false)}</button>`)
    .join("");

  const buttons = widget.querySelectorAll(".star-btn");

  function paint(val) {
    buttons.forEach((b) => {
      b.classList.toggle("filled", Number(b.dataset.val) <= val);
      b.innerHTML = starIconSvg(Number(b.dataset.val) <= val);
    });
  }

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      current = Number(b.dataset.val);
      hiddenInput.value = current;
      paint(current);
      const err = document.querySelector('[data-error-for="rating"]');
      if (err) err.textContent = "";
    });
    b.addEventListener("mouseenter", () => paint(Number(b.dataset.val)));
  });
  widget.addEventListener("mouseleave", () => paint(current));
}

function initFeedbackForm() {
  const form = document.getElementById("feedbackForm");
  if (!form) return;
  const alertEl = document.getElementById("feedbackAlert");
  const submitBtn = form.querySelector('button[type="submit"]');

  setupFormValidation(
    form,
    {
      feedbackName: (v) => Validate.required(v, "Name"),
      feedbackComment: (v) => Validate.minLength(v, 10, "Comment"),
    },
    async (data) => {
      const rating = Number(document.getElementById("ratingValue").value || 0);
      if (!rating) {
        document.querySelector('[data-error-for="rating"]').textContent = "Please select a rating.";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      try {
        await ApexDB.addItem("testimonials", { name: data.feedbackName, comment: data.feedbackComment, rating });
        showAlert(alertEl, "Thank you! Your feedback has been submitted and will appear once reviewed.", "success");
        submitBtn.disabled = false;
        celebrateSuccess(submitBtn, "Submit Feedback");
        form.reset();
        document.getElementById("ratingValue").value = "";
        initStarRatingWidget();
      } catch (err) {
        showAlert(alertEl, err.message || "Something went wrong. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Feedback";
      }
    }
  );
}

async function renderApprovedTestimonials() {
  const grid = document.getElementById("allTestimonials");
  if (!grid) return;
  const testimonials = (await ApexDB.getCollection("testimonials")).sort((a, b) => new Date(b.date) - new Date(a.date));

  grid.innerHTML = testimonials.length
    ? testimonials.map(testimonialCardHTML).join("")
    : `<div class="empty-state"><p>No approved testimonials yet. Be the first to share your experience below.</p></div>`;

  initScrollReveal();
}

document.addEventListener("DOMContentLoaded", async () => {
  initStarRatingWidget();
  initFeedbackForm();
  await renderApprovedTestimonials();
});
