/**
 * booking.js — validation + message-building for the cart/checkout flow.
 * Pure functions only — no DOM access — so pages/components stay in charge of wiring.
 */

/**
 * @param {{checkIn:string, checkOut:string, guests?:number}} fields
 * @returns {{valid:boolean, errors:Object}}
 */
export function validateBookingDates({ checkIn, checkOut, guests = 1 }) {
  const errors = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const inD = checkIn ? new Date(checkIn) : null;
  const outD = checkOut ? new Date(checkOut) : null;

  if (!checkIn) errors.checkIn = 'Check-in date is required.';
  else if (inD < today) errors.checkIn = 'Check-in cannot be in the past.';

  if (!checkOut) errors.checkOut = 'Check-out date is required.';
  else if (inD && outD <= inD) errors.checkOut = 'Check-out must be after check-in.';

  if (guests < 1) errors.guests = 'At least one guest is required.';

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Build a human-readable cart summary for WhatsApp / Telegram.
 * @param {Array} items — cart items ({name, location, type, priceEstimate, emoji})
 * @param {{checkIn?:string, checkOut?:string, guests?:number, platform?:string, guestName?:string}} details
 */
export function buildBookingMessage(items, { checkIn = '', checkOut = '', guests = '', platform = '', guestName = '' } = {}) {
  if (!items.length) return '';

  const header = '🧭 *RentRover AI — Booking Request*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  const detailBlock = (checkIn || checkOut || guests || platform || guestName)
    ? '📅 *Trip details*\n' +
      (guestName ? `   From:      ${guestName}\n` : '') +
      (checkIn   ? `   Check-in:  ${checkIn}\n`   : '') +
      (checkOut  ? `   Check-out: ${checkOut}\n`  : '') +
      (guests    ? `   Guests:    ${guests}\n`    : '') +
      (platform  ? `   Booking via: ${platform}\n` : '') +
      '\n'
    : '';

  const propertyLines = items
    .map((item, i) =>
      `${i + 1}. ${item.emoji || '🏠'} *${item.name}*\n` +
      `   📍 ${item.location}\n` +
      `   🏷️ ${item.type}  |  ${item.priceEstimate}\n`)
    .join('\n');

  const footer =
    '\n━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    `Total stays: ${items.length}\n\n` +
    'Please confirm availability and help finalize this booking. Thank you! 🙏';

  return header + detailBlock + '*🧳 Your stays:*\n\n' + propertyLines + footer;
}
