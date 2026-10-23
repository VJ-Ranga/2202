/** Pure validation and normalization for audited product customisation. */

export function clampQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(99, Math.max(1, Math.trunc(quantity)));
}

export function eligibleProduct(config, productId) {
  return Array.isArray(config?.eligibleProductIds)
    && config.eligibleProductIds.includes(Number(productId));
}

function placementConfig(config, id) {
  return (config?.placements ?? []).find((placement) => placement?.id === id);
}

function choice(config, placement, field, id) {
  return (placementConfig(config, placement)?.[field] ?? []).find((item) => item?.id === id);
}

function validPlacement(config, raw) {
  if (!raw || typeof raw !== 'object') return { error: 'Choose placement.' };
  const placement = placementConfig(config, raw.id);
  if (!placement) return { error: 'Choose a valid placement.' };
  const text = typeof raw.text === 'string' ? raw.text : '';
  const max = Number(config.maxLength) || 10;
  if (!text) return { error: `${placement.label} text is required.` };
  if ([...text].length > max) return { error: `${placement.label} text must be ${max} characters or fewer.` };
  const font = choice(config, raw.id, 'fonts', raw.fontId);
  if (!font) return { error: `Choose a font for ${placement.label}.` };
  const color = choice(config, raw.id, 'colors', raw.colorId);
  if (!color) return { error: `Choose a colour for ${placement.label}.` };
  return {
    value: {
      id: placement.id,
      label: placement.label,
      text,
      fontId: font.id,
      fontLabel: font.label,
      colorId: color.id,
      colorLabel: color.label,
      colorValue: color.value,
    },
  };
}

export function normalizePersona(config, raw) {
  if (!raw || typeof raw !== 'object') return null;
  const placements = Array.isArray(raw.placements) ? raw.placements : [];
  const normalized = placements.slice(0, 2).map((item) => validPlacement(config, item).value).filter(Boolean);
  if (!normalized.length) return null;
  const first = normalized[0];
  return {
    name: first.text,
    font: first.fontLabel,
    color: first.colorLabel,
    placements: normalized,
    fee: Number(config.feePerUnit) || 1000,
  };
}

export function validateSelection(config, productId, raw) {
  if (!eligibleProduct(config, productId)) return { valid: false, error: 'Personalisation is not available for this product.' };
  if (!raw || raw.enabled === false || raw == null) return { valid: true, value: null };
  const placements = Array.isArray(raw.placements) ? raw.placements : [];
  if (!placements.length) return { valid: false, error: 'Choose at least one placement.' };
  if (placements.length > 2) return { valid: false, error: 'Choose no more than two placements.' };
  const ids = new Set();
  const values = [];
  for (const item of placements) {
    if (ids.has(item?.id)) return { valid: false, error: 'Choose each placement only once.' };
    ids.add(item?.id);
    const result = validPlacement(config, item);
    if (result.error) return { valid: false, error: result.error };
    values.push(result.value);
  }
  const normalized = normalizePersona(config, { placements: values });
  return { valid: true, value: normalized };
}
