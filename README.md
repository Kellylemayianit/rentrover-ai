# RentRover AI

One page. Three panes. Nothing else.

- **Stays** — search a place or requirement, browse results as cards. This
  is the only pane that talks to the search backend.
- **Ask** — a plain-language Q&A box, grounded in whatever Stays currently
  has loaded (price, ratings, amenities, a specific stay by name). It does
  **not** run new searches — that's Stays' job. Same relationship as
  NotebookLM's Chat to its Sources.
- **Cart** — your picks, checkout via a real booking platform in an in-app
  browser, your booking history, and a local (no-login) contact profile —
  cart, bookings, and profile in one pane.

Always visible side-by-side on desktop; a bottom nav bar (NotebookLM's
mobile pattern) switches between them under 900px.

No marketing homepage, no login, no admin dashboard — just this.

## Architecture

```
index.html          the entire shell — <link> tags + <script type="module" src="src/app.js">
styles/
  tokens.css           variables, reset, base type, layout primitives
  utilities/buttons.css
  components/
    modal.css            the shared modal (map view, comparison table)
    booking.css           Ask pane's message log + input, Cart pane's items/dates
    workspace.css          top bar, 3-pane grid, bottom nav, checkout/profile/orders styling
src/
  app.js               the kernel — mounts the one page, delegates every data-action click
  pages/
    workspace.js          the entire app: Stays, Ask, and Cart panes, all in one file
  components/
    mapPanel.js            schematic map (modal), used by Stays' "Map" button
    comparisonMatrix.js    the comparison table (modal), used by Stays' "Compare" flow
    inAppBrowser.js         full-screen checkout overlay used by Cart's platform buttons
    modal.js                 shared modal open/close
  services/
    api.js                 live HTTP client — the ONLY file that talks to the backend
    dataLoader.js            thin cache over api.js
    cartStore.js              client-side cart state
    ordersStore.js             booking/order tracking, persisted to localStorage, scoped to the signed-in account (simulated auto-progress — see below)
    authStore.js               sign up / log in / log out — real endpoint first, local demo fallback
    themeStore.js              light/dark toggle, persisted, defaults to system preference
    propertyRegistry.js          shared id → property lookup so "Add to cart" and Ask's
                                  "View in Stays" links work no matter which pane fetched the data
  utilities/
    helpers.js               DOM helpers, formatting, toast
    askEngine.js               Ask's grounded-answer logic — see below
    booking.js                 date validation + booking-message builder
    channelLinks.js            wa.me / t.me / WeChat / mailto: / tel: link builders
    platformLinks.js            builds the checkout URL for Booking.com/Airbnb/Trip.com
    icons.js                    shared inline-SVG icon set
```

There's no router — there's nothing to route between. Deep links use plain
query params on the one URL: `?q=lisbon` runs a search on load, `?pane=cart`
opens straight to the Cart pane (used by nothing in-app right now, but
handy for a shared link).

## Look & feel

Grey glassmorphism: frosted, translucent panes over a soft blurred-blob
background, in light or dark — toggle via the sun/moon button in the top
bar (`services/themeStore.js`). It remembers your choice (`localStorage`)
and defaults to your system preference the first time. Every heading and
subheading in the app is centered by default (`tokens.css`'s `h1,h2,h3,
.heading,.subheading` rule) rather than left-aligned at the margin.

## Accounts

The top bar's left button opens sign in / sign up. There's no user-account
backend yet (see the endpoint table below) — `services/authStore.js` tries
the real endpoint first, and if that fails, falls back to a small
localStorage-backed demo account store so the flow is fully usable today.
That fallback is explicitly **not secure** (passwords are only lightly
obscured, not hashed) and is why "measuring users" doesn't actually work
yet — none of this data leaves the browser until `/api/auth/*` exists.
Signing in reattaches any cart/bookings made as a guest to your account,
and both persist in `localStorage` across visits from then on.

## How Ask actually works

`utilities/askEngine.js` is a deterministic, rule-based Q&A over whatever
properties Stays currently has loaded (cheapest/priciest, best-rated,
"under $X", amenity keywords, "tell me about \<name\>"). It's a stand-in for
real grounded LLM Q&A — the seam to swap in a real one is that exact
function signature: `answerQuestion(question, stays) → { text, highlightIds }`.
Replace the body with a call to something like `POST /api/ask { question,
stayIds }` (a small model over the normalized listing JSON, per the earlier
Cloudflare Workers AI architecture notes) once that endpoint exists.

## In-app checkout browser

Clicking a platform button on a cart item opens `components/inAppBrowser.js`
— a full-screen overlay with an `<iframe>` pointed at that platform. It
prefers a real per-listing URL from the property's `sources` array; if none
exists (e.g. Trip.com, which isn't in `sources` yet) it falls back to that
platform's public search page for the property's city.

**Known limitation:** most booking platforms send headers that refuse to
render inside an iframe, and there's no reliable way to detect that from
the parent page — so the overlay always shows a visible "Open in a new tab
instead" button rather than pretending the embed will always work.

## Orders & "automatic" progress

There is no order-management backend. `services/ordersStore.js` persists
orders to `localStorage`, scoped to the signed-in account (or to the
current browser as a guest, until you sign in — signing in reattaches
those). It creates an order the moment someone opens a platform's
checkout, and steps its status (`Requested → Confirmed → Upcoming stay →
Completed`) on a timer purely as a demo of the Cart pane's tracking UI.
Replace `_simulateProgress` with real status updates once a backend
exists for that.

## Contact channels

- **WhatsApp** — `wa.me` link with the cart summary pre-filled. Works as expected.
- **Telegram** — uses `t.me/share/url`, Telegram's real share-intent link;
  it opens Telegram's own chat picker with the message attached. There's no
  public Telegram URL that opens a prefilled DM to one specific user the
  way `wa.me` does.
- **WeChat** — there is no public web link that opens a chat with a
  specific contact. `channelLinks.js`'s `wechatContact()` just returns the
  ID/QR note to display — it does not pretend to deep-link.

## Backend contract

`src/services/api.js` expects the search backend to return properties in
this normalized shape:

```ts
{
  id: string; name: string; type: string;
  city: string; country: string; region: string; description: string;
  pricePerNight: number; currency: string;
  rating?: number; reviewCount?: number;
  tags: string[]; amenities: string[];
  image: string; gallery?: string[]; emoji?: string;
  sources: { platform: string; price: number; url: string; cancellation?: string }[];
}
```

The only endpoint this app calls: `GET /api/search/combined?q=&region=&type=&maxPrice=`,
plus the auth calls below (both fall back to a local demo — see "Accounts").

| Endpoint | Method | Status |
|---|---|---|
| `/api/search/combined` | GET | **Live per spec** |
| `/api/auth/signup` | POST `{name,email,password}` | Not yet on backend — local demo fallback |
| `/api/auth/login` | POST `{email,password}` | Not yet on backend — local demo fallback |

Set the backend origin in `src/services/api.js`:

```js
const API_BASE = ''; // e.g. 'https://api.rentrover.ai' — empty = same-origin
```

**CORS:** the backend must allow requests from wherever this frontend is
served, since `api.js` calls it directly from the browser.

**Failure handling:** every fetch is wrapped in try/catch and shows an
inline "can't reach the backend" message rather than crashing — there is
no mock data to fall back to.

## Notes

- No build step — plain ES modules loaded via `<script type="module">`.
  Serve the folder with any static file server (the `file://` protocol
  will not allow module imports).
- Cart, bookings, your theme choice, and your account are all persisted in
  `localStorage`, so they survive a refresh. None of it is synced to a
  server yet — see the endpoint tables above for what that needs.
