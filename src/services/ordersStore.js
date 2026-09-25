/**
 * ordersStore.js — client-side order tracking for the Cart pane's "Your
 * orders" section.
 *
 * IMPORTANT: there is no order-management backend yet (see README —
 * only /api/search/combined is live). So "marking progress automatically"
 * is simulated here with a timer that steps each order through a fixed
 * status sequence, clearly for demo purposes. Replace `_simulateProgress`
 * with real status updates (webhook from the booking platform, or a
 * status poll against a real /api/orders/:id) once that backend exists —
 * everything else (the store shape, onChange, getOrders) can stay as-is.
 */

const STATUS_SEQUENCE = ['Requested', 'Confirmed', 'Upcoming stay', 'Completed'];
const SIMULATED_STEP_MS = 45000; // demo pacing — a real backend would push updates instead

let orders = [];
const _listeners = [];

export function onChange(fn) {
  _listeners.push(fn);
}

function _notify() {
  _listeners.forEach(fn => fn([...orders]));
}

/**
 * @param {{items:Array, platform:string, checkIn?:string, checkOut?:string}} payload
 * @returns {Object} the created order
 */
export function createOrder({ items, platform, checkIn = '', checkOut = '' }) {
  const order = {
    id: `ord-${Date.now()}`,
    items,
    platform,
    checkIn,
    checkOut,
    status: STATUS_SEQUENCE[0],
    createdAt: Date.now(),
  };
  orders = [order, ...orders];
  _notify();
  _simulateProgress(order.id);
  return order;
}

export function getOrders() {
  return [...orders];
}

function _simulateProgress(orderId) {
  let step = 0;
  const tick = () => {
    step++;
    if (step >= STATUS_SEQUENCE.length) return;
    orders = orders.map(o => o.id === orderId ? { ...o, status: STATUS_SEQUENCE[step] } : o);
    _notify();
    setTimeout(tick, SIMULATED_STEP_MS);
  };
  setTimeout(tick, SIMULATED_STEP_MS);
}
