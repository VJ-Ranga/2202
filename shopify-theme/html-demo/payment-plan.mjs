/** Display-only payment calculations. All arithmetic is in integer cents. */
export function splitPayments(total, count = 3) {
  if (!Number.isFinite(total) || total < 0 || !Number.isInteger(count) || count < 1) return [];
  const cents = Math.round(total * 100);
  if (!Number.isSafeInteger(cents)) return [];
  const base = Math.floor(cents / count);
  const remainder = cents % count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}

export function checkoutTotals(subtotal) {
  if (!Number.isFinite(subtotal) || subtotal < 0) return null;
  const goods = Math.round(subtotal * 100) / 100;
  const shipping = goods > 0 && goods < 5000 ? 400 : 0;
  return { subtotal: goods, shipping, total: Math.round((goods + shipping) * 100) / 100 };
}
