/**
 * pages/home.js — landing page. Composes header/hero/footer components
 * and fetches its own data via dataLoader.js.
 */

import { renderHeader } from '../components/header.js';
import { renderHero } from '../components/hero.js';
import { renderCtaBanner, renderFooter } from '../components/footer.js';
import { renderPropertyGrid, renderDestinationGrid } from '../components/propertyCard.js';
import { loadProperties, loadDestinations } from '../services/dataLoader.js';
import { getCartCount, getCart } from '../services/cartStore.js';
import { registerProperties } from '../services/propertyRegistry.js';
import { $ } from '../utilities/helpers.js';

export async function renderHomePage(root) {
  root.innerHTML = `
    ${renderHeader({ activeRoute: 'home', cartCount: getCartCount() })}

    ${renderHero()}

    <div class="feature-strip" aria-label="Platform highlights">
      <div class="feature-chip"><span class="feature-chip__icon">🌍</span> Stays on every continent</div>
      <div class="feature-chip"><span class="feature-chip__icon">💬</span> Just ask, in plain words</div>
      <div class="feature-chip"><span class="feature-chip__icon">🧳</span> Save a few favorites to one cart</div>
      <div class="feature-chip"><span class="feature-chip__icon">✅</span> Book on Booking.com, Airbnb, or Trip.com — without leaving</div>
    </div>

    <section class="section section--regions" id="destinations">
      <div class="section__header">
        <span class="section__tag">Where to next</span>
        <h2 class="section__title display-lg">Featured destinations.</h2>
        <p class="section__subtitle">A starting point — we can find a stay almost anywhere.</p>
      </div>
      <div id="destinations-grid">
        <p class="text-muted text-center">Loading destinations…</p>
      </div>
    </section>

    <section class="section section--featured">
      <div class="section__header">
        <span class="section__tag">Handpicked stays</span>
        <h2 class="section__title display-lg">Featured properties.</h2>
        <p class="section__subtitle">A taste of what's waiting — we know every listing in detail.</p>
      </div>
      <div id="featured-grid">
        <p class="text-muted text-center">Loading properties…</p>
      </div>
    </section>

    <section class="testimonial">
      <div class="testimonial__stars">★★★★★</div>
      <blockquote class="testimonial__quote">
        "Found our Santorini suite through RentRover and the whole booking took ten minutes — I never had to leave the site."
      </blockquote>
      <p class="testimonial__author">— Amara T. · Cyclades getaway</p>
    </section>

    ${renderCtaBanner()}
    ${renderFooter()}
  `;

  // Populate async content after the shell is on screen. Each grid fetches
  // and fails independently — one endpoint being down shouldn't blank the page.
  const addedIds = new Set(getCart().map(i => i.id));
  const featuredGrid = $('#featured-grid', root);
  const destGrid = $('#destinations-grid', root);

  loadProperties()
    .then(properties => {
      registerProperties(properties);
      if (featuredGrid) featuredGrid.innerHTML = renderPropertyGrid(properties.slice(0, 8), { addedIds });
    })
    .catch(() => { if (featuredGrid) featuredGrid.innerHTML = `<p class="text-muted text-center">Couldn't reach the search backend just now — try again shortly.</p>`; });

  loadDestinations()
    .then(destinations => { if (destGrid) destGrid.innerHTML = renderDestinationGrid(destinations); })
    .catch(() => { if (destGrid) destGrid.innerHTML = `<p class="text-muted text-center">Destinations aren't available right now.</p>`; });
}
