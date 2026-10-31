import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../theme/assets/personalisation-logic.js');
const complete = (overrides = {}) => ({ id: 'pocket-hem', label: 'Pocket Hem', text: 'Liyan', font: 'Freestyle Script', colour: 'Black', ...overrides });

test('validates Unicode code points and rejects whitespace-only text', () => {
  assert.equal(logic.validateText('😀😀😀😀😀😀😀😀😀😀', 10), true);
  assert.equal(logic.validateText('😀😀😀😀😀😀😀😀😀😀😀', 10), false);
  assert.equal(logic.validateText('😀😀😀😀😀😀😀😀😀😀😀', 30), false);
  assert.equal(logic.validateText('   ', 10), false);
});

test('accepts one or both placements, but rejects duplicates and more than two', () => {
  const second = complete({ id: 'pocket', label: 'Pocket' });
  assert.equal(logic.validateSelection([complete()]), true);
  assert.equal(logic.validateSelection([complete(), second]), true);
  assert.equal(logic.validateSelection([complete(), complete()]), false);
  assert.equal(logic.validateSelection([complete(), second, { ...complete(), id: 'third' }]), false);
});

test('rejects missing font or colour', () => {
  assert.equal(logic.validateSelection([complete({ font: '' })]), false);
  assert.equal(logic.validateSelection([complete({ colour: '' })]), false);
});

test('formats and builds line item properties', () => {
  const selection = complete();
  assert.equal(logic.formatProperty(selection), 'Liyan · Freestyle Script · Black');
  assert.deepEqual(logic.buildProperties([selection], 'fixed-id'), {
    'Pocket Hem': 'Liyan · Freestyle Script · Black',
    _personalisation_id: 'fixed-id',
  });
});

test('generates unique ids', () => {
  assert.notEqual(logic.newId(), logic.newId());
});
