import test from 'node:test';
import assert from 'node:assert/strict';
import { splitPayments, checkoutTotals } from './payment-plan.mjs';

test('three instalments preserve the exact total, including cent remainders', () => {
  for (const amount of [0, 0.01, 0.02, 3890, 4390, 4490.99]) {
    const parts = splitPayments(amount);
    assert.equal(parts.length, 3);
    assert.equal(parts.reduce((n, part) => n + Math.round(part * 100), 0), Math.round(amount * 100));
    assert(Math.max(...parts) - Math.min(...parts) < 0.011);
  }
});
test('delivery applies below the threshold and is free from Rs 5,000', () => {
  assert.deepEqual(checkoutTotals(3990), { subtotal: 3990, shipping: 400, total: 4390 });
  assert.equal(checkoutTotals(4999.99).shipping, 400);
  assert.equal(checkoutTotals(5000).shipping, 0);
  assert.equal(checkoutTotals(0).total, 0);
});
test('invalid monetary inputs never produce a payment plan', () => {
  for (const value of [NaN, Infinity, -1, '3990']) {
    assert.deepEqual(splitPayments(value), []);
    assert.equal(checkoutTotals(value), null);
  }
  assert.deepEqual(splitPayments(100, 0), []);
});
