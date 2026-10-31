(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PersonalisationLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const codePointLength = (value) => [...String(value ?? '')].length;

  function validateText(value, maxLength = 10) {
    const text = typeof value === 'string' ? value.trim() : '';
    const limit = Math.min(Number(maxLength) || 10, 10);
    return text !== '' && codePointLength(text) <= limit;
  }

  function validateSelection(placements, options = {}) {
    const list = Array.isArray(placements) ? placements : [];
    const maxLength = Math.min(Number(options.maxLength) || 10, 10);
    const allowed = options.allowedPlacements;
    if (!list.length || list.length > 2) return false;
    const ids = new Set();
    return list.every((item) => {
      if (!item || !item.id || ids.has(item.id)) return false;
      if (Array.isArray(allowed) && !allowed.includes(item.id)) return false;
      ids.add(item.id);
      return validateText(item.text, maxLength) && Boolean(item.font) && Boolean(item.colour);
    });
  }

  function formatProperty(selection) {
    return `${String(selection.text ?? '').trim()} · ${selection.font} · ${selection.colour}`;
  }

  function buildProperties(placements, id = newId()) {
    const properties = { _personalisation_id: id };
    (Array.isArray(placements) ? placements : []).forEach((selection) => {
      properties[selection.label || selection.id] = formatProperty(selection);
    });
    return properties;
  }

  function newId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `pers_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }

  return { codePointLength, validateText, validateSelection, formatProperty, buildProperties, newId };
});
