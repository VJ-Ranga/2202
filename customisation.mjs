import { eligibleProduct, validateSelection, normalizePersona, clampQuantity } from './customisation-logic.mjs';
import { MAX_QUANTITY } from './store.mjs';

const CONFIG_URL = new URL('./assets/customisation-data.json', import.meta.url);
let configPromise;

function loadConfig() {
  configPromise ??= fetch(CONFIG_URL).then((response) => {
    if (!response.ok) throw new Error('Customisation configuration could not be loaded.');
    return response.json();
  });
  return configPromise;
}

function node(tag, properties = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'className') element.className = value;
    else if (key === 'htmlFor') element.htmlFor = value;
    else if (key === 'text') element.textContent = value;
    else if (key === 'checked' || key === 'disabled' || key === 'hidden' || key === 'required') element[key] = Boolean(value);
    else if (key === 'value') element.value = value;
    else element.setAttribute(key, String(value));
  }
  element.append(...children.filter(Boolean));
  return element;
}

function loadStylesheet() {
  if (document.getElementById('customisation-styles')) return;
  document.head.append(node('link', {
    id: 'customisation-styles', rel: 'stylesheet',
    href: new URL('./customisation.css', import.meta.url).href,
  }));
}

function sourceImage(path) {
  return new URL(path, import.meta.url).href;
}

function buyableVariant(variant) {
  return Boolean(variant && variant.available && typeof variant.price === 'number' && Number.isFinite(variant.price) && variant.price >= 0);
}

function focusFirstAvailableVariant() {
  const candidate = document.querySelector('[data-variant-available="true"], .variant-pill:not([disabled]), [name^="attribute_"]:not([disabled])');
  candidate?.focus();
}

function focusables(container) {
  return [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((item) => !item.hidden && item.offsetParent !== null);
}

export async function buildCustomisation(product, options = {}) {
  const config = await loadConfig();
  if (!eligibleProduct(config, product?.id)) return null;

  const {
    getSelectedVariant = () => null,
    getQuantity = () => 1,
    onAddToBag = async () => {},
    onVariationRequired = () => {},
    viewCartUrl = '#',
    checkoutUrl = '#',
  } = options;
  loadStylesheet();

  const state = { phase: 'select', placements: [], editingId: null, success: false, closeConfirm: false };
  let trigger;
  let dialog;
  let bodyOverflow = '';
  let bodyScrollY = 0;
  let lastFocus = null;

  const root = node('section', { className: 'customisation' });
  const status = node('p', { className: 'customisation__status', role: 'alert', hidden: true });
  trigger = node('button', {
    type: 'button', className: 'customisation__trigger',
    'aria-haspopup': 'dialog', 'aria-expanded': 'false',
    text: config.button?.label || 'Add Personalisation',
  });
  root.append(trigger, status);

  const placementConfig = (id) => config.placements.find((placement) => placement.id === id);
  const selected = (id) => state.placements.find((item) => item.id === id);
  const complete = () => validateSelection(config, product.id, { enabled: true, placements: state.placements }).valid;
  const hasChoices = () => state.placements.length > 0;
  const clearStatus = () => { status.textContent = ''; status.hidden = true; };
  const showStatus = (message) => { status.textContent = message; status.hidden = false; };
  const setDialogStatus = (message) => {
    const target = dialog?.querySelector('.customisation__dialog-error');
    if (!target) return;
    target.textContent = message || '';
    target.hidden = !message;
  };

  function resetState() {
    state.phase = 'select'; state.placements = []; state.editingId = null; state.success = false; state.closeConfirm = false;
  }

  function textFor(id) {
    return selected(id) ?? { id, text: '', fontId: '', colorId: '' };
  }

  function focusInvalid(id) {
    const item = selected(id) ?? state.placements[0];
    if (!item) return;
    if (item.text === '' || [...item.text].length > config.maxLength) {
      dialog.querySelector(`#custom-text-${CSS.escape(item.id)}`)?.focus();
    } else if (!item.fontId) {
      dialog.querySelector(`[data-choice-type="font"][data-choice-placement="${CSS.escape(item.id)}"]`)?.focus();
    } else {
      dialog.querySelector(`[data-choice-type="color"][data-choice-placement="${CSS.escape(item.id)}"]`)?.focus();
    }
  }

  function placementCard(placement) {
    const button = node('button', { type: 'button', className: 'customisation__placement-card' });
    button.append(node('img', { src: sourceImage(placement.image), alt: `${placement.label} placement`, loading: 'lazy' }), node('span', { text: placement.label }), node('span', { className: 'customisation__arrow', text: '›' }));
    button.addEventListener('click', () => {
      const record = textFor(placement.id);
      if (state.editingId && state.editingId !== placement.id) {
        state.placements = state.placements.filter((item) => item.id !== state.editingId);
      }
      if (!state.placements.some((item) => item.id === placement.id)) state.placements.push(record);
      state.editingId = placement.id;
      state.phase = 'steps';
      render();
    });
    return button;
  }

  function choiceButton(item, type, placementId, selectedId, disabled) {
    const button = node('button', {
      type: 'button', className: `customisation__choice customisation__choice--${type}`,
      'aria-pressed': String(item.id === selectedId), 'aria-disabled': String(disabled),
      disabled, 'data-choice-type': type, 'data-choice-placement': placementId,
    });
    if (type === 'font') button.append(node('img', { src: sourceImage(item.previewImage), alt: `${item.label} font preview`, loading: 'lazy' }));
    else if (item.label === 'Navy' && item.value === '#e7e5d6') button.classList.add('customisation__choice--neutral');
    else button.style.setProperty('--custom-colour', item.value);
    button.append(node('span', { text: item.label }));
    button.addEventListener('click', () => {
      const record = selected(placementId);
      record[ type === 'font' ? 'fontId' : 'colorId' ] = item.id;
      render();
      dialog.querySelector(`[data-choice-type="${type}"][data-choice-placement="${CSS.escape(placementId)}"][aria-pressed="true"]`)?.focus();
    });
    return button;
  }

  function stepBlock(placement, record) {
    const fieldset = node('fieldset', { className: 'customisation__steps', 'data-placement': placement.id });
    fieldset.append(node('legend', { text: placement.label }));
    const textId = `custom-text-${placement.id}`;
    const textInput = node('input', {
      id: textId, type: 'text', placeholder: 'Add Text', maxlength: config.maxLength,
      value: record.text, required: true, 'aria-describedby': `${textId}-count`,
    });
    const count = node('span', { id: `${textId}-count`, className: 'customisation__count', text: `${[...record.text].length} / ${config.maxLength}` });
    const fontLocked = record.text === '' || [...record.text].length > config.maxLength;
    const colorLocked = fontLocked || !record.fontId;
    textInput.addEventListener('input', () => {
      record.text = textInput.value;
      count.textContent = `${[...record.text].length} / ${config.maxLength}`;
      clearStatus(); setDialogStatus(''); renderChoicesOnly(placement, record);
    });
    const fontGroup = node('div', { className: 'customisation__choices', role: 'group', 'aria-label': `${placement.label} font` }, ...placement.fonts.map((item) => choiceButton(item, 'font', placement.id, record.fontId, fontLocked)));
    const colorGroup = node('div', { className: 'customisation__choices', role: 'group', 'aria-label': `${placement.label} colour` }, ...placement.colors.map((item) => choiceButton(item, 'color', placement.id, record.colorId, colorLocked)));
    fieldset.append(
      node('div', { className: 'customisation__step customisation__step--text' }, node('h3', { text: '1 · Add Text' }), node('label', { htmlFor: textId, text: 'Add Text' }), node('div', { className: 'customisation__input-row' }, textInput, count)),
      node('div', { className: `customisation__step${fontLocked ? ' is-locked' : ''}` }, node('h3', { text: '2 · Select Font' }), fontGroup),
      node('div', { className: `customisation__step${colorLocked ? ' is-locked' : ''}` }, node('h3', { text: '3 · Select Colour' }), colorGroup),
    );
    return fieldset;
  }

  function renderChoicesOnly(placement, record) {
    const fieldset = dialog.querySelector(`[data-placement="${CSS.escape(placement.id)}"]`);
    if (!fieldset) return;
    const groups = fieldset.querySelectorAll('.customisation__choices');
    const fontLocked = record.text === '' || [...record.text].length > config.maxLength;
    const colorLocked = fontLocked || !record.fontId;
    groups[0].replaceChildren(...placement.fonts.map((item) => choiceButton(item, 'font', placement.id, record.fontId, fontLocked)));
    groups[1].replaceChildren(...placement.colors.map((item) => choiceButton(item, 'color', placement.id, record.colorId, colorLocked)));
    groups[0].parentElement.classList.toggle('is-locked', fontLocked);
    groups[1].parentElement.classList.toggle('is-locked', colorLocked);
  }

  function reviewCard(item) {
    const placement = placementConfig(item.id);
    const font = placement.fonts.find((choice) => choice.id === item.fontId);
    const color = placement.colors.find((choice) => choice.id === item.colorId);
    const card = node('article', { className: 'customisation__review-card' });
    const edit = node('button', { type: 'button', className: 'customisation__text-button', text: config.messages.edit });
    const remove = node('button', { type: 'button', className: 'customisation__text-button', text: `${config.messages.remove} ×`, 'aria-label': `Remove ${placement.label}` });
    edit.addEventListener('click', () => { state.editingId = item.id; state.phase = 'steps'; render(); });
    remove.addEventListener('click', () => {
      state.placements = state.placements.filter((entry) => entry.id !== item.id);
      clearStatus();
      if (!state.placements.length) state.phase = 'select';
      render();
    });
    card.append(node('div', { className: 'customisation__review-heading' }, node('strong', { text: placement.label }), node('span', {}, edit, remove)));
    card.append(node('p', { text: `${placement.steps[0].label} / ${item.text}` }), node('p', { text: `${placement.steps[1].label} / ${font.label}` }), node('p', { text: `${placement.steps[2].label} / ${color.label}` }));
    return card;
  }

  function confirmation() {
    const layer = node('div', { className: 'customisation__confirm-layer', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'customisation-confirm-title' });
    const box = node('div', { className: 'customisation__confirm-box' });
    const keep = node('button', { type: 'button', className: 'customisation__secondary', text: config.messages.confirmNo });
    const yes = node('button', { type: 'button', className: 'customisation__primary', text: config.messages.confirmYes });
    box.append(node('h2', { id: 'customisation-confirm-title', text: config.messages.confirmClose }), node('div', { className: 'customisation__confirm-actions' }, yes, keep));
    layer.append(box);
    keep.addEventListener('click', () => { state.closeConfirm = false; render(); });
    yes.addEventListener('click', () => { state.closeConfirm = false; closeDialog(true); });
    return layer;
  }

  function successBody() {
    const view = node('a', { className: 'customisation__primary', href: viewCartUrl, text: config.messages.viewCart });
    const checkout = node('a', { className: 'customisation__primary', href: checkoutUrl, text: config.messages.checkout });
    const continueButton = node('button', { type: 'button', className: 'customisation__secondary', text: config.messages.continueShopping });
    continueButton.addEventListener('click', () => closeDialog(true));
    return node('div', { className: 'customisation__success' }, node('h2', { text: config.messages.addedToBag }), node('p', { text: config.messages.successNote }), node('div', { className: 'customisation__success-actions' }, checkout, view, continueButton));
  }

  function render() {
    const headerTitle = state.phase === 'select' ? config.messages.choosePlacement : state.phase === 'review' ? config.messages.review : config.panel.headerTitle;
    const progress = state.phase === 'steps' ? (state.placements.length && complete() ? 100 : state.placements.length ? progressValue() : 0) : state.phase === 'review' ? 100 : 0;
    dialog.replaceChildren();
    const header = node('header', { className: 'customisation__dialog-header' });
    const close = node('button', { type: 'button', className: 'customisation__close', 'aria-label': config.messages.close, text: '×' });
    close.addEventListener('click', requestClose);
    header.append(node('h1', { id: 'customisation-dialog-title', text: headerTitle }), close);
    const progressBar = node('div', { className: 'customisation__progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(progress) });
    progressBar.append(node('span', { className: 'customisation__progress-value' }));
    progressBar.firstChild.style.width = `${progress}%`;
    const content = node('div', { className: 'customisation__dialog-content' });
    content.append(node('p', { className: 'customisation__dialog-error', role: 'alert', hidden: true }));
    const footer = node('footer', { className: 'customisation__dialog-footer' });
    if (state.success) {
      content.append(successBody());
    } else if (state.phase === 'select') {
      content.append(node('h2', { text: config.messages.choosePlacementHeading }), node('div', { className: 'customisation__placement-list' }, ...config.placements.filter((item) => !selected(item.id)).map(placementCard)));
    } else if (state.phase === 'steps') {
      const item = selected(state.editingId) ?? state.placements[0];
      content.append(stepBlock(placementConfig(item.id), item));
      const continueButton = node('button', { type: 'button', className: 'customisation__primary', text: config.messages.continue });
      continueButton.addEventListener('click', () => {
        const result = validateSelection(config, product.id, { enabled: true, placements: [item] });
        if (!result.valid) { setDialogStatus(result.error); focusInvalid(item.id); return; }
        state.phase = 'review'; state.editingId = null; render();
      });
      footer.append(continueButton);
    } else if (state.phase === 'review') {
      content.append(node('h2', { text: config.messages.yourChoices }), node('div', { className: 'customisation__review-list' }, ...state.placements.map(reviewCard)), node('p', { className: 'customisation__fee-line', text: `${config.messages.feeLabel} / +Rs.1,000.00` }), node('p', { className: 'customisation__total', text: 'PERSONALISATION TOTAL: / RS.1,000.00' }));
      if (state.placements.length < 2) {
        const add = node('button', { type: 'button', className: 'customisation__add-another', text: `＋ ${config.messages.addAnother}` });
        add.addEventListener('click', () => { state.phase = 'select'; render(); });
        content.append(add);
      }
      const addToBag = node('button', { type: 'button', className: 'customisation__primary', text: config.messages.addToBag });
      addToBag.addEventListener('click', addToBagAction);
      footer.append(addToBag);
    }
    if (state.closeConfirm) content.append(confirmation());
    dialog.append(header, progressBar, content, footer);
    if (state.closeConfirm) dialog.querySelector('.customisation__confirm-box button')?.focus();
  }

  function progressValue() {
    const item = selected(state.editingId) ?? state.placements[0];
    if (!item) return 0;
    return (item.text !== '' ? 33 : 0) + (item.fontId ? 33 : 0) + (item.colorId ? 34 : 0);
  }

  async function addToBagAction() {
    let rawQuantity;
    try { rawQuantity = getQuantity(); } catch { rawQuantity = NaN; }
    if (!Number.isInteger(rawQuantity) || rawQuantity < 1 || rawQuantity > MAX_QUANTITY) {
      setDialogStatus(`Quantity must be an integer from 1 to ${MAX_QUANTITY}.`);
      return;
    }
    const result = validateSelection(config, product.id, { enabled: true, placements: state.placements });
    if (!result.valid) { state.phase = 'steps'; state.editingId = state.placements[0]?.id ?? null; render(); setDialogStatus(result.error); focusInvalid(state.editingId); return; }
    const variant = product.variants?.length ? getSelectedVariant() : null;
    if (product.variants?.length && !buyableVariant(variant)) { closeDialog(true); requireVariation(); return; }
    const quantity = clampQuantity(rawQuantity);
    const button = dialog.querySelector('.customisation__primary');
    if (button) { button.disabled = true; button.textContent = config.messages.adding; }
    try {
      void variant; void quantity;
      await onAddToBag(result.value);
      state.success = true; state.phase = 'success'; render();
    } catch (error) {
      setDialogStatus(error?.message || config.messages.errorGeneric);
      if (button) { button.disabled = false; button.textContent = config.messages.addToBag; }
    }
  }

  function requireVariation() {
    const message = config.messages.selectVariation;
    showStatus(message); onVariationRequired();
    setTimeout(focusFirstAvailableVariant, 0);
  }

  function requestClose(event) {
    if (event) event.preventDefault();
    if (hasChoices() && !state.success) { state.closeConfirm = true; render(); return; }
    closeDialog(true);
  }

  function closeDialog(force = false) {
    if (!dialog) return;
    if (!force && hasChoices()) { state.closeConfirm = true; render(); return; }
    dialog.close();
    document.body.style.overflow = bodyOverflow;
    window.scrollTo(0, bodyScrollY);
    trigger.setAttribute('aria-expanded', 'false');
    lastFocus?.focus?.();
    lastFocus = null;
    resetState();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); requestClose(event); return; }
    if (event.key !== 'Tab' || !dialog?.open) return;
    const focusRoot = state.closeConfirm ? dialog.querySelector('.customisation__confirm-layer') : dialog;
    const items = focusables(focusRoot || dialog);
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  dialog = node('dialog', { className: 'customisation__dialog', 'aria-labelledby': 'customisation-dialog-title' });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) requestClose(event); });
  dialog.addEventListener('cancel', requestClose);
  dialog.addEventListener('keydown', handleKeydown);
  root.append(dialog);

  function open() {
    if (dialog.open) return;
    if (document.querySelector('dialog[open]')) return;
    clearStatus(); resetState(); lastFocus = document.activeElement;
    bodyOverflow = document.body.style.overflow; bodyScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    render(); dialog.showModal(); trigger.setAttribute('aria-expanded', 'true');
    dialog.querySelector('.customisation__close')?.focus();
  }

  trigger.addEventListener('click', () => {
    const variant = product.variants?.length ? getSelectedVariant() : null;
    if (product.variants?.length && !buyableVariant(variant)) { requireVariation(); return; }
    open();
  });

  return {
    node: root,
    trigger,
    getSelection: () => {
      if (!state.placements.length) return null;
      const result = validateSelection(config, product.id, { enabled: true, placements: state.placements });
      if (!result.valid) throw new Error(`Customisation validation: ${result.error}`);
      return result.value;
    },
    getFee: () => (state.placements.length && complete() ? Number(config.feePerUnit) || 1000 : 0),
    open,
    close: () => closeDialog(),
  };
}
