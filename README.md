# RentRover AI

A global travel-search frontend. No "concierge," no "itinerary" — you tell
it what you want in plain words, it shows you real stays, you save a few
to a cart, and you book on whichever platform you trust (Booking.com,
Airbnb, Trip.com) without leaving the site.

The main experience (`#/app`) is three panes shown side-by-side on
desktop — **Stays**, **Ask**, **Cart** — inspired by NotebookLM's
Sources/Chat/Studio layout. On mobile they collapse into three tabs.

This build has **no local/mock data** — every property and search result
comes from the live search backend via `src/services/api.js`.

## Architecture

```
index.html          SPA shell — <link> tags + <script type="module" src="src/app.js">
styles/
  tokens.css           variables, reset, base type, layout primitives
  utilities/buttons.css
  components/           header, hero, card (+ shared modal), booking (chat log + checkout bits), footer, workspace (3-pane layout, map/compare modals, in-app browser, orders)
  dashboard/             sidebar/bottom-nav, stat cards, admin shell/tables/forms
src/
  app.js               route dispatch + all delegated event wiring (the kernel)
  router.js            hash parsing + change subscription
  pages/                 one file per route, composes components + fetches data
  components/            pure render functions (public + components/admin/)
  services/
    api.js                 live HTTP client — the ONLY file that talks to the backend
    dataLoader.js           the only data import surface pages/components use (adds caching)
    cartStore.js            client-side cart state + subscribers
    ordersStore.js          client-side order tracking (simulated auto-progress — see below)
    propertyRegistry.js     shared in-memory id → property lookup, so "Add to cart" works
                             the same way no matter which page/pane fetched the data
  utilities/
    helpers.js              DOM query/inject helpers, formatting, toast
    booking.js               date validation + booking-message builder
    channelLinks.js          wa.me / t.me / WeChat / mailto: / tel: link builders
    platformLinks.js         builds the checkout URL for Booking.com/Airbnb/Trip.com
    auth.js                  mock admin login check + in-memory session flag
    icons.js                 shared inline-SVG icon set
```

## The three panes (`#/app`)

- **Stays** — search box + result cards. Each card can be added to the cart
  or marked for comparison (pick 2 → a "Compare" button opens a modal with
  a merged comparison table). A "Map" button opens a schematic map
  (illustrative pins, not a real map SDK — see `components/mapPanel.js`).
- **Ask** — a chat box. Typing a question runs the same search as the
  Stays search box and fills that pane with results; Ask just narrates
  what it found.
- **Cart** — what you've added, a check-in/out date picker, per-stay
  "Book via Booking.com / Airbnb / Trip.com" buttons (opens an **in-app
  browser** overlay, see below), a "Talk to our team" section
  (WhatsApp / Telegram / WeChat), and a running list of orders with status
  badges.

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

There is no order-management backend yet. `services/ordersStore.js`
creates a client-side order the moment someone opens a platform's checkout,
and steps its status (`Requested → Confirmed → Upcoming stay → Completed`)
on a timer purely as a demo of what the Cart pane's tracking UI will look
like. Replace `_simulateProgress` with real status updates (a webhook from
the booking platform, or a poll against a real `/api/orders/:id`) once
that backend exists.

## Contact channels

- **WhatsApp** — `wa.me` link with the cart summary pre-filled. Works as expected.
- **Telegram** — uses `t.me/share/url`, Telegram's share-intent link; it opens
  Telegram's own chat picker with the message attached. There's no public
  Telegram URL that opens a prefilled DM to one specific user the way `wa.me` does.
- **WeChat** — there is no public web link that opens a chat with a specific
  contact. `channelLinks.js`'s `wechatContact()` just returns the ID/QR note
  to display — it does not pretend to deep-link.

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

### Endpoint status

| Endpoint | Method | Used by | Status |
|---|---|---|---|
| `/api/search/combined?q=&region=&type=&maxPrice=` | GET | Stays search, Ask pane, landing page catalog | **Live per spec** |
| `/api/properties/:id` | GET | — | Not yet on backend (unused — comparisons reuse already-fetched results, see `propertyRegistry.js`) |
| `/api/destinations` | GET | landing page destination cards | Not yet on backend |
| `/api/bookings` | GET / POST | admin bookings list, enquiry persistence | Not yet on backend |
| `/api/properties` | POST / PUT / DELETE | admin add/edit/delete | Not yet on backend |

Set the backend origin in `src/services/api.js`:

```js
const API_BASE = ''; // e.g. 'https://api.rentrover.ai' — empty = same-origin
```

**CORS:** the backend must allow requests from wherever this frontend is
served, since `api.js` calls it directly from the browser.

**Failure handling:** every page fetch is wrapped in try/catch and shows an
inline "can't reach the backend" message rather than crashing or silently
falling back to fake data — there is no mock data left to fall back to.

## Routes

| Hash                     | Page                                  |
|---------------------------|----------------------------------------|
| `#/`                       | Landing page (hero, destinations, featured stays) |
| `#/app`                    | The three-pane app (Stays / Ask / Cart) |
| `#/app?q=...`               | Pre-run a search on load |
| `#/app?pane=cart`           | Open straight to the Cart pane (mobile) |
| `#/chat`                    | Alias for `#/app`, kept so old links still work |
| `#/login`                    | Mock admin login (`admin@rentrover.ai` / `demo1234`) |
| `#/dashboard`                 | Admin overview (stat cards + recent bookings) |
| `#/dashboard/properties`       | Admin property list (add/edit/delete — wired to the not-yet-live endpoints above) |
| `#/dashboard/bookings`          | Admin booking list |

The admin dashboard is a separate, business-facing area — distinct from
the Cart pane's customer-facing order tracking.

## Notes

- No build step — plain ES modules loaded via `<script type="module">`.
  Serve the folder with any static file server (the `file://` protocol
  will not allow module imports).
- Admin auth is a mock (`sessionStorage` flag) for prototyping only —
  replace `utilities/auth.js` with a real auth endpoint before handling
  real guest/booking data.
