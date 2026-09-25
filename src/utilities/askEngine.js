/**
 * askEngine.js — answers a question grounded in the stays currently
 * loaded in the Stays pane, the same way NotebookLM's chat only answers
 * from whatever Sources are loaded rather than going and fetching new
 * ones itself.
 *
 * This is a deterministic, rule-based stand-in for real grounded LLM
 * Q&A (see the earlier architecture notes on using a small model — e.g.
 * Cloudflare Workers AI — over normalized listing JSON). The seam to
 * swap in a real call is exactly this function's signature: keep
 * `answerQuestion(question, stays)` returning `{ text, highlightIds }`,
 * and replace the body with a request to something like
 * `POST /api/ask { question, stayIds }`.
 *
 * @param {string} question
 * @param {Array} stays — the properties currently listed in the Stays pane
 * @returns {{text: string, highlightIds: string[]}} highlightIds are
 *   property ids the UI should highlight/scroll to in the Stays pane
 */
export function answerQuestion(question, stays) {
  const q = question.toLowerCase().trim();

  if (!stays.length) {
    return { text: "There's nothing in Stays yet — search a place or a vibe over there first, then ask me about what comes back.", highlightIds: [] };
  }

  if (!q) {
    return { text: "Go ahead — ask me anything about the stays currently listed.", highlightIds: [] };
  }

  // "how many..." / count
  if (/\bhow many\b/.test(q)) {
    return { text: `There ${stays.length === 1 ? 'is' : 'are'} **${stays.length}** stay${stays.length === 1 ? '' : 's'} listed right now.`, highlightIds: [] };
  }

  // cheapest / lowest price
  if (/\bcheap(est)?\b|\blowest price\b|\bbudget\b/.test(q)) {
    const sorted = [...stays].sort((a, b) => a.pricePerNight - b.pricePerNight);
    const top = sorted[0];
    return { text: `The cheapest is **${top.name}** in ${top.city} at ${formatMoney(top.pricePerNight, top.currency)}/night.`, highlightIds: [top.id] };
  }

  // most expensive
  if (/\bmost expensive\b|\bpricier\b|\bpricey\b|\bhighest price\b/.test(q)) {
    const sorted = [...stays].sort((a, b) => b.pricePerNight - a.pricePerNight);
    const top = sorted[0];
    return { text: `The priciest is **${top.name}** in ${top.city} at ${formatMoney(top.pricePerNight, top.currency)}/night.`, highlightIds: [top.id] };
  }

  // budget under $X
  const underMatch = q.match(/under\s*\$?(\d+)/);
  if (underMatch) {
    const max = Number(underMatch[1]);
    const matches = stays.filter(s => s.pricePerNight <= max);
    if (!matches.length) return { text: `Nothing under $${max} in the current list — the cheapest is ${formatMoney(Math.min(...stays.map(s => s.pricePerNight)), stays[0].currency)}/night.`, highlightIds: [] };
    return { text: `**${matches.length}** stay${matches.length === 1 ? '' : 's'} under $${max}: ${matches.map(s => s.name).join(', ')}.`, highlightIds: matches.map(s => s.id) };
  }

  // best / top rated
  if (/\bbest\b|\btop.rated\b|\bhighest rated\b/.test(q)) {
    const sorted = [...stays].filter(s => s.rating).sort((a, b) => b.rating - a.rating);
    if (!sorted.length) return { text: "None of the current stays have a rating on file yet.", highlightIds: [] };
    const top = sorted[0];
    return { text: `Best-rated is **${top.name}** at ⭐ ${top.rating}${top.reviewCount ? ` (${top.reviewCount} reviews)` : ''}.`, highlightIds: [top.id] };
  }

  // "tell me about X" / fuzzy name match
  const named = stays.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q.replace(/^(tell me about|what about|what is)\s*/, '').trim()));
  if (named) {
    const amenities = (named.amenities || []).slice(0, 4).join(', ');
    return {
      text: `**${named.name}** — ${named.city}, ${named.country}. ${named.description || ''}${amenities ? `\n\nAmenities: ${amenities}.` : ''}\n\n${formatMoney(named.pricePerNight, named.currency)}/night.`,
      highlightIds: [named.id],
    };
  }

  // amenity / vibe keyword search within the loaded stays
  const amenityMatches = stays.filter(s => {
    const haystack = [s.type, s.description, ...(s.tags || []), ...(s.amenities || [])].join(' ').toLowerCase();
    return q.split(/\s+/).some(word => word.length > 3 && haystack.includes(word));
  });
  if (amenityMatches.length) {
    return {
      text: `${amenityMatches.length} of the current stays match that: ${amenityMatches.map(s => s.name).join(', ')}.`,
      highlightIds: amenityMatches.map(s => s.id),
    };
  }

  return {
    text: "I can only answer from what's currently in Stays — try asking about price, rating, amenities, or a specific stay by name. If none of these fit, search for something new in Stays first.",
    highlightIds: [],
  };
}

function formatMoney(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
