import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoplay } from './autoplay.mjs';

class Events {
  constructor() { this.listeners = new Map(); this.attributes = {}; this.textContent = ''; this.isConnected = true; }
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  dispatch(type, event = {}) { for (const fn of this.listeners.get(type) ?? []) fn({ type, target: this, ...event }); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  contains(node) { return node === this; }
}

function harness({ reduced = false } = {}) {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const root = new Events();
  const toggle = new Events();
  const live = new Events();
  const documentRef = new Events();
  documentRef.visibilityState = 'visible';
  documentRef.body = {};
  documentRef.querySelector = () => null;
  const windowRef = new Events();
  const media = new Events();
  media.matches = reduced;
  windowRef.matchMedia = () => media;
  class IO { constructor(callback) { this.callback = callback; } observe() {} disconnect() { this.disconnected = true; } trigger(isIntersecting = true) { this.callback([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }]); } }
  class MO { constructor(callback) { this.callback = callback; } observe() {} disconnect() { this.disconnected = true; } }
  const advance = [];
  const controller = createAutoplay({
    root, toggle, live, documentRef, windowRef,
    IntersectionObserverCtor: IO, MutationObserverCtor: MO,
    matchMediaFn: () => media,
    setTimeoutFn: (fn, ms) => { const id = nextId++; timers.set(id, { at: now + ms, fn }); return id; },
    clearTimeoutFn: (id) => timers.delete(id),
    advance: () => advance.push(now),
  });
  const observer = controller;
  return {
    root, toggle, live, documentRef, windowRef, media, controller, advance,
    intersect: (visible = true) => { const entry = [...timers.values()]; void entry; },
    triggerVisible: () => { /* observer is captured through the test hook below */ },
    tick(ms) {
      const target = now + ms;
      while (true) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at; timers.delete(due[0]); due[1].fn();
      }
      now = target;
    },
    pending: () => timers.size,
    time: () => now,
    setVisible: (value) => { root._intersection?.(value); },
  };
}

// Intersection visibility starts true in these tests by triggering the constructor callback through a small shared hook.
function visibleHarness(options) {
  const h = harness(options);
  // createAutoplay observes immediately; emulate browser's initial intersection callback by dispatching a visible state through a fresh observer is not exposed.
  // Root remains connected and tests use the no-observer fallback below for deterministic timer assertions.
  h.controller.dispose();
  return createNoIntersectionHarness(options);
}

function createNoIntersectionHarness({ reduced = false, intersection = false } = {}) {
  let now = 0; let nextId = 1; const timers = new Map();
  const root = new Events(); const toggle = new Events(); const live = new Events();
  const documentRef = new Events(); documentRef.visibilityState = 'visible'; documentRef.body = {}; let dialogOpen = false; documentRef.querySelector = () => dialogOpen ? {} : null;
  const windowRef = new Events(); const media = new Events(); media.matches = reduced; windowRef.matchMedia = () => media;
  const advances = [];
  let intersectionCallback = null;
  class IO { constructor(callback) { intersectionCallback = callback; } observe() {} disconnect() {} }
  const controller = createAutoplay({ root, toggle, live, documentRef, windowRef, IntersectionObserverCtor: intersection ? IO : null, MutationObserverCtor: null, matchMediaFn: () => media, setTimeoutFn: (fn, ms) => { const id = nextId++; timers.set(id, { at: now + ms, fn }); return id; }, clearTimeoutFn: (id) => timers.delete(id), advance: () => advances.push(now) });
  if (intersectionCallback) intersectionCallback([{ isIntersecting: true, intersectionRatio: 1 }]);
  const tick = (ms) => { const target = now + ms; while (true) { const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0]; if (!due) break; now = due[1].at; timers.delete(due[0]); due[1].fn(); } now = target; };
  return { root, toggle, live, documentRef, windowRef, media, controller, advances, tick, pending: () => timers.size, now: () => now, setVisible: (value) => intersectionCallback?.([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]), setDialog: (value) => { dialogOpen = value; documentRef.dispatch('visibilitychange'); } };
}

test('advances at 6000ms, never early, and keeps one timer', () => {
  const h = createNoIntersectionHarness();
  h.tick(5999); assert.deepEqual(h.advances, []); assert.equal(h.pending(), 1);
  h.tick(1); assert.deepEqual(h.advances, [6000]); assert.equal(h.pending(), 1);
});

test('manual pause persists; play restarts with fresh interval', () => {
  const h = createNoIntersectionHarness();
  h.toggle.dispatch('click'); h.tick(12000); assert.deepEqual(h.advances, []); assert.equal(h.controller.manualPaused, true);
  h.toggle.dispatch('click'); h.tick(5999); assert.deepEqual(h.advances, []); h.tick(1); assert.deepEqual(h.advances, [18000]);
});

test('hover, focus, hidden, dialog, and out-of-view pauses resume fresh', () => {
  const h = createNoIntersectionHarness();
  h.root.dispatch('pointerover'); h.tick(9000); assert.deepEqual(h.advances, []);
  h.root.dispatch('pointerout'); h.tick(5999); assert.deepEqual(h.advances, []); h.tick(1); assert.equal(h.advances.length, 1);
  h.root.dispatch('focusin', { target: {} }); h.tick(7000); assert.equal(h.advances.length, 1);
  h.root.dispatch('focusout', { relatedTarget: null }); h.tick(6000); assert.equal(h.advances.length, 2);
  h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatch('visibilitychange'); h.tick(7000); assert.equal(h.advances.length, 2);
  h.documentRef.visibilityState = 'visible'; h.documentRef.dispatch('visibilitychange'); h.tick(5999); assert.equal(h.advances.length, 2);
  h.setDialog(true); h.tick(7000); assert.equal(h.advances.length, 2);
  h.setDialog(false); h.tick(6000); assert.equal(h.advances.length, 3);
});

test('manual navigation resets interval without catch-up', () => {
  const h = createNoIntersectionHarness();
  h.tick(5000); h.controller.manualInteraction(); h.tick(1000); assert.deepEqual(h.advances, []);
  h.tick(4999); assert.deepEqual(h.advances, []); h.tick(1); assert.deepEqual(h.advances, [11000]);
});

test('reduced motion blocks default autoplay but explicit Play overrides', () => {
  const h = createNoIntersectionHarness({ reduced: true });
  assert.equal(h.toggle.getAttribute('aria-label'), 'Play slideshow');
  assert.equal(h.toggle.textContent, '▶');
  h.tick(7000); assert.deepEqual(h.advances, []); assert.equal(h.pending(), 0);
  h.toggle.dispatch('click'); h.tick(6000); assert.deepEqual(h.advances, [13000]);
  h.media.matches = true; h.media.dispatch('change', { matches: true });
  assert.equal(h.toggle.getAttribute('aria-label'), 'Play slideshow');
  h.tick(7000); assert.deepEqual(h.advances, [13000]);
  h.toggle.dispatch('click'); h.tick(6000); assert.deepEqual(h.advances, [13000, 26000]);
});

test('out-of-view stops timer and resumes fresh when visible', () => {
  const h = createNoIntersectionHarness({ intersection: true });
  h.setVisible(false); h.tick(9000); assert.deepEqual(h.advances, []);
  h.setVisible(true); h.tick(5999); assert.deepEqual(h.advances, []); h.tick(1); assert.deepEqual(h.advances, [15000]);
});

test('dispose clears timer and event lifecycle', () => {
  const h = createNoIntersectionHarness();
  h.controller.dispose(); assert.equal(h.pending(), 0); h.tick(10000); assert.deepEqual(h.advances, []);
});

test('touch pointer events do not trigger desktop hover pause', () => {
  const h = createNoIntersectionHarness();
  h.root.dispatch('pointerover', { pointerType: 'touch' });
  h.tick(6000);
  assert.deepEqual(h.advances, [6000]);
});
