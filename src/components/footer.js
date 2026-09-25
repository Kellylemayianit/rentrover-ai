/**
 * footer.js — pure render functions for the CTA banner and site footer.
 */

export function renderCtaBanner() {
  return `
    <section class="cta-banner">
      <div class="cta-banner__content">
        <h2 class="cta-banner__title display-md">Ready to plan your next stay?</h2>
        <p class="cta-banner__sub">Just say what you're picturing, save a few favorites, and book straight on Booking.com, Airbnb, or Trip.com — no jumping between tabs.</p>
        <a href="#/app" class="btn btn--primary" style="font-size:1.05rem;padding:1rem 2.5rem;">
          Find a Stay — It's Free →
        </a>
      </div>
    </section>
  `;
}

export function renderFooter() {
  return `
    <footer class="site-footer">
      <p>© 2026 RentRover AI · <a href="#/">rentrover.ai</a> · Stays in every corner of the world</p>
      <p style="margin-top:.5rem">Powered by a love of travel 🧭</p>
    </footer>
  `;
}
