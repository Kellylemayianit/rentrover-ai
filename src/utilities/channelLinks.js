/**
 * channelLinks.js — build outbound contact links: WhatsApp, Telegram,
 * WeChat, mailto, tel. Each config value is swapped per-deployment here.
 */

export const CONTACT = {
  whatsappNumber: '15550001234',   // digits only, country code, no leading +
  telegramUsername: 'rentroverai', // no leading @
  wechatId: 'rentrover-ai',        // WeChat has no universal web deep-link — see wechatContact()
  email: 'hello@rentrover.ai',
  phone: '+15550001234',
};

export function waLink(message, number = CONTACT.whatsappNumber) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Telegram's public web links can't prefill a message into an arbitrary
 * user's DM the way wa.me can — https://t.me/share/url is the closest
 * equivalent (it opens Telegram's own chat picker with the text attached).
 */
export function telegramLink(message, url = 'https://rentrover.ai') {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
}

/**
 * WeChat has no public "open a chat with prefilled text" URL scheme —
 * contact only happens by scanning a QR code or searching the ID inside
 * the app. This returns the raw ID so the UI can display it / render a
 * QR code, rather than pretending a working deep link exists.
 */
export function wechatContact(id = CONTACT.wechatId) {
  return { id, note: 'Search this ID in WeChat, or scan our QR code — WeChat doesn\'t support direct chat links.' };
}

export function mailtoLink(subject, body, to = CONTACT.email) {
  const q = new URLSearchParams({ subject, body }).toString();
  return `mailto:${to}?${q}`;
}

export function telLink(number = CONTACT.phone) {
  return `tel:${number.replace(/\s+/g, '')}`;
}

/** Open a link in a new tab safely. */
export function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
