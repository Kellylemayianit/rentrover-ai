/**
 * hero.js — landing page hero, including the inline destination search bar.
 */

export function renderHero() {
  return `
    <section class="hero" id="hero">
      <svg class="hero__globe-dots" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="dotFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <g fill="#cfa672" opacity="0.5">
          ${Array.from({ length: 140 }).map(() => {
            const x = Math.round(Math.random() * 1440);
            const y = Math.round(Math.random() * 900);
            const r = (Math.random() * 1.4 + 0.5).toFixed(1);
            return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
          }).join('')}
        </g>
      </svg>

      <div class="hero__content">
        <div class="hero__eyebrow"><span>🌍</span> Stays in every corner of the world</div>
        <h1 class="hero__title display-xl">
          Sleep somewhere<br><em>unforgettable.</em>
        </h1>
        <p class="hero__subtitle">
          From safari lodges in Amboseli to cliffside suites in Santorini — just say what you want, pick your favorites, and book on the platform you trust.
        </p>
        <div class="hero__actions">
          <a href="#/app" class="btn btn--primary">🧭 Find a Stay</a>
          <a href="#destinations" class="btn btn--outline">Explore Destinations ↓</a>
        </div>

        <form class="hero-search" id="hero-search-form" data-component="hero-search">
          <input
            class="hero-search__input"
            id="hero-search-input"
            type="text"
            placeholder="Try “beach villa in Bali” or “Lisbon guesthouse”…"
            autocomplete="off"
          >
          <button type="submit" class="btn btn--dark">Search</button>
        </form>
      </div>
    </section>
  `;
}
