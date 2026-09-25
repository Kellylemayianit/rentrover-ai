/**
 * icons.js — shared inline-SVG icon set, kept as small string constants
 * so any component/page can drop `${ICONS.chevronLeft}` straight into markup.
 */

export const ICONS = {
  chevronLeft: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  chevronDown: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  bag: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 6V4.5a2.5 2.5 0 115 0V6M2 6h12l-1.2 7.5H3.2L2 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  send: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7l5.5 3" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  whatsapp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`,

  compass: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><path d="M15 9l-3.6 1.4L9 14l3.6-1.4L15 9z" fill="currentColor"/></svg>`,

  grid: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>`,

  bed: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 13V6.5A1.5 1.5 0 012.5 5H8a1.5 1.5 0 011.5 1.5V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M1 9h13.5A1.5 1.5 0 0116 10.5V13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="4" cy="7.2" r="1" fill="currentColor"/></svg>`,

  chart: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14V2M2 14h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M4.5 11V8M8 11V5M11.5 11V9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  users: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.3" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M10.5 2.2c1.2.2 2 1.3 2 2.6s-.8 2.4-2 2.6M12 10.3c1.7.4 3 1.7 3 3.7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,

  logout: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  edit: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8-3.5.5.5-3.5 8-8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,

  trash: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9a1 1 0 001 .9h4.8a1 1 0 001-.9L12 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  search: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M14 14l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  chat: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 4.5A1.5 1.5 0 014 3h10a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0114 12H7l-3.2 2.6a.4.4 0 01-.65-.31V12h-.65A1.5 1.5 0 012.5 10.5v-6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
};
