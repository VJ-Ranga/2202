(function () {
  'use strict';
  if (!window.PersonalisationLogic) return;
  const L = window.PersonalisationLogic;
  const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

  class PersonalisationDrawer extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;
      this.initialised = true;
      this.config = JSON.parse(this.querySelector('.personalisation__config').textContent);
      this.form = document.getElementById(this.dataset.formId);
      this.trigger = this.querySelector('.personalisation__trigger');
      this.status = this.querySelector('.personalisation__status');
      this.state = { phase: 'picker', placements: [], editing: null, confirm: false, error: '' };
      this.trigger.addEventListener('click', () => this.open());
      this.variantUnsubscribe = window.subscribe && typeof PUB_SUB_EVENTS !== 'undefined'
        ? subscribe(PUB_SUB_EVENTS.variantChange, () => this.updateVariantState()) : null;
      this.cartUnsubscribe = window.subscribe && typeof PUB_SUB_EVENTS !== 'undefined'
        ? subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => { if (this.pending && event?.source === 'product-form') this.cartSuccess(); }) : null;
      this.errorUnsubscribe = window.subscribe && typeof PUB_SUB_EVENTS !== 'undefined'
        ? subscribe(PUB_SUB_EVENTS.cartError, (event) => { if (this.pending) this.showError(event?.message || this.config.messages.cartError); }) : null;
    }

    disconnectedCallback() { this.variantUnsubscribe?.(); this.cartUnsubscribe?.(); this.errorUnsubscribe?.(); }
    updateVariantState() { this.variantId = this.form?.querySelector('[name="id"]')?.value || ''; }
    variantReady() { const input = this.form?.querySelector('[name="id"]'); const submit = this.form?.closest('product-form')?.querySelector('[name="add"]'); return Boolean(input && !input.disabled && input.value && input.value !== '0' && submit && !submit.disabled); }
    configPlacement(id) { return this.config.placements.find((item) => item.id === id); }
    selected(id) { return this.state.placements.find((item) => item.id === id); }
    current() { return this.selected(this.state.editing); }
    hasChoices() { return this.state.placements.length > 0; }
    valid(item) { return item && L.validateText(item.text, this.config.maxLength) && item.font && item.colour; }
    progress() { const item = this.current(); return this.state.phase === 'review' ? 100 : item ? (item.text.trim() ? 33 : 0) + (item.font ? 33 : 0) + (item.colour ? 34 : 0) : 0; }

    open() {
      if (!this.variantReady()) { this.status.textContent = this.config.messages.variation; this.status.hidden = false; return; }
      this.status.hidden = true; this.lastFocus = document.activeElement; this.state = { phase: 'picker', placements: [], editing: null, confirm: false, error: '' };
      this.render(); this.overlay.hidden = false; this.dialog.hidden = false; this.trigger.setAttribute('aria-expanded', 'true'); this.lockScroll(); this.setBackgroundInert(true); this.closeButton.focus();
    }

    requestClose() { this.hasChoices() ? this.showConfirm() : this.close(true); }
    showConfirm() { this.state.confirm = true; this.render(); this.confirmYes.focus(); }
    close(force = false) {
      if (!force && this.hasChoices()) return this.showConfirm();
      this.removeFields(); this.pending = false; this.state = { phase: 'picker', placements: [], editing: null, confirm: false, error: '' };
      this.dialog.hidden = true; this.overlay.hidden = true; this.trigger.setAttribute('aria-expanded', 'false'); this.setBackgroundInert(false); this.unlockScroll(); this.trigger.focus();
    }

    setupShell() {
      if (this.dialog) return;
      this.overlay = el('div', 'personalisation__overlay'); this.overlay.hidden = true; this.overlay.addEventListener('click', () => this.requestClose()); document.body.append(this.overlay);
      this.dialog = el('section', 'personalisation__drawer'); this.dialog.hidden = true; this.dialog.setAttribute('role', 'dialog'); this.dialog.setAttribute('aria-modal', 'true'); this.dialog.setAttribute('aria-labelledby', 'personalisation-title');
      this.dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); this.requestClose(); return; }
        if (event.key !== 'Tab') return;
        const root = this.state.confirm ? this.confirmLayer : this.dialog; const nodes = [...root.querySelectorAll(FOCUSABLE)].filter((node) => !node.hidden && node.offsetParent !== null); if (!nodes.length) return;
        const index = nodes.indexOf(document.activeElement); if (event.shiftKey && (index <= 0)) { event.preventDefault(); nodes[nodes.length - 1].focus(); } else if (!event.shiftKey && (index === nodes.length - 1)) { event.preventDefault(); nodes[0].focus(); }
      });
      document.body.append(this.dialog);
    }

    lockScroll() {
      if (this.scrollLock) return;
      this.scrollLock = { y: window.scrollY, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow };
      document.body.style.position = 'fixed'; document.body.style.top = `-${this.scrollLock.y}px`; document.body.style.width = '100%'; document.body.style.overflow = 'hidden'; document.body.classList.add('personalisation-open');
    }

    unlockScroll() {
      if (!this.scrollLock) return;
      const lock = this.scrollLock; this.scrollLock = null;
      document.body.style.position = lock.position; document.body.style.top = lock.top; document.body.style.width = lock.width; document.body.style.overflow = lock.overflow; document.body.classList.remove('personalisation-open'); window.scrollTo(0, lock.y);
    }

    setBackgroundInert(hidden) {
      if (hidden) {
        this.backgroundState = [...document.body.children].filter((node) => node !== this.overlay && node !== this.dialog).map((node) => ({ node, inert: node.inert, ariaHidden: node.getAttribute('aria-hidden') }));
        this.backgroundState.forEach(({ node }) => { node.inert = true; node.setAttribute('aria-hidden', 'true'); });
      } else {
        (this.backgroundState || []).forEach(({ node, inert, ariaHidden }) => { node.inert = inert; if (ariaHidden == null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', ariaHidden); });
        this.backgroundState = null;
      }
    }

    render() {
      this.setupShell(); this.dialog.replaceChildren();
      const header = el('header', 'personalisation__header'); const title = el('h2', null, this.state.phase === 'picker' ? 'Choose placement' : this.state.phase === 'review' ? 'Review' : 'Personalisation'); title.id = 'personalisation-title';
      this.closeButton = el('button', 'personalisation__close', '×'); this.closeButton.type = 'button'; this.closeButton.setAttribute('aria-label', 'Close'); this.closeButton.addEventListener('click', () => this.requestClose()); header.append(title, this.closeButton);
      const progress = el('div', 'personalisation__progress'); progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100'); progress.setAttribute('aria-valuenow', String(this.progress())); const progressValue = el('span'); progressValue.style.width = `${this.progress()}%`; progress.append(progressValue);
      const body = el('div', 'personalisation__body'); this.errorNode = el('p', 'personalisation__error', this.state.error); this.errorNode.hidden = !this.state.error; this.errorNode.setAttribute('role', 'alert'); body.append(this.errorNode);
      const footer = el('footer', 'personalisation__footer');
      if (this.state.phase === 'picker') this.renderPicker(body);
      if (this.state.phase === 'steps') this.renderSteps(body, footer);
      if (this.state.phase === 'review') this.renderReview(body, footer);
      this.dialog.append(header, progress, body, footer);
      if (this.state.confirm) this.renderConfirm();
    }

    renderPicker(body) {
      body.append(el('h3', null, 'Where would you like it?')); const list = el('div', 'personalisation__placements');
      this.config.placements.filter((item) => !this.selected(item.id)).forEach((placement) => { const button = el('button', 'personalisation__placement'); button.type = 'button'; const image = document.createElement('img'); image.src = placement.image; image.alt = `${placement.label} placement`; image.loading = 'lazy'; const label = el('span', null, placement.label); const arrow = el('span', 'personalisation__arrow', '›'); label.append(arrow); button.append(image, label); button.addEventListener('click', () => { this.state.placements.push({ id: placement.id, label: placement.label, text: '', font: '', colour: '' }); this.state.editing = placement.id; this.state.phase = 'steps'; this.state.error = ''; this.render(); }); list.append(button); }); body.append(list);
    }

    renderSteps(body, footer) {
      const placement = this.configPlacement(this.state.editing); const item = this.current(); const fieldset = el('fieldset', 'personalisation__steps'); const legend = el('legend', null, placement.label); fieldset.append(legend);
      const textStep = el('div', 'personalisation__step'); textStep.append(el('h3', null, '1 · Add Text')); const row = el('div', 'personalisation__input'); const input = document.createElement('input'); input.type = 'text'; input.value = item.text; input.setAttribute('aria-label', 'Add Text'); const count = el('span', 'personalisation__count', `${L.codePointLength(item.text)} / ${this.config.maxLength}`); input.addEventListener('input', () => { if (L.codePointLength(input.value.trim()) > this.config.maxLength) { input.value = item.text; this.state.error = `Text must be ${this.config.maxLength} characters or fewer.`; this.errorNode.textContent = this.state.error; this.errorNode.hidden = false; return; } item.text = input.value; count.textContent = `${L.codePointLength(item.text)} / ${this.config.maxLength}`; this.syncLocks(fieldset, item); this.state.error = ''; this.errorNode.hidden = true; }); row.append(input, count); textStep.append(row);
      const fontStep = el('div', 'personalisation__step'); fontStep.append(el('h3', null, '2 · Select Font')); const fonts = el('div', 'personalisation__choices'); placement.fonts.forEach((font) => fonts.append(this.choice(font, 'font', item, font.label))); fontStep.append(fonts);
      const colourStep = el('div', 'personalisation__step'); colourStep.append(el('h3', null, '3 · Select Colour')); const colours = el('div', 'personalisation__choices'); placement.colours.forEach((colour) => colours.append(this.choice(colour, 'colour', item, colour.label))); colourStep.append(colours);
      fieldset.append(textStep, fontStep, colourStep); this.syncLocks(fieldset, item); body.append(fieldset); const button = el('button', 'personalisation__button personalisation__button--primary', 'Continue'); button.type = 'button'; button.addEventListener('click', () => { if (!this.valid(item)) { this.state.error = this.config.messages.required; this.render(); this.focusInvalid(item); return; } this.state.phase = 'review'; this.state.editing = null; this.state.error = ''; this.render(); }); footer.append(button);
    }

    syncLocks(fieldset, item) { const steps = fieldset.querySelectorAll('.personalisation__step'); steps[1].classList.toggle('is-locked', !item.text.trim()); steps[2].classList.toggle('is-locked', !item.font); steps[1].querySelectorAll('button').forEach((button) => { button.disabled = !item.text.trim(); }); steps[2].querySelectorAll('button').forEach((button) => { button.disabled = !item.font; }); }
    choice(option, type, item, label) { const button = el('button', 'personalisation__choice'); button.type = 'button'; button.setAttribute('aria-pressed', String(item[type] === label)); if (type === 'font') { const image = document.createElement('img'); image.src = option.image; image.alt = `${label} font preview`; button.append(image); } else { button.classList.add('personalisation__colour'); button.style.setProperty('--colour', option.value); } button.append(el('span', null, label)); button.addEventListener('click', () => { item[type] = label; if (type === 'font' && item.colour && !this.configPlacement(item.id).colours.some((colour) => colour.label === item.colour)) item.colour = ''; this.state.error = ''; this.render(); }); return button; }
    focusInvalid(item) { if (!item) return; const target = !L.validateText(item.text, this.config.maxLength) ? this.dialog.querySelector('input') : !item.font ? this.dialog.querySelector('.personalisation__step:nth-child(2) button') : this.dialog.querySelector('.personalisation__step:nth-child(3) button'); target?.focus(); }

    renderReview(body, footer) { body.append(el('h3', null, 'Your Choices')); const list = el('div', 'personalisation__review-list'); this.state.placements.forEach((item) => { const placement = this.configPlacement(item.id); const card = el('article', 'personalisation__review'); const heading = el('div', 'personalisation__review-head'); heading.append(el('strong', null, placement.label)); const edit = el('button', 'personalisation__link', 'Edit'); edit.type = 'button'; edit.addEventListener('click', () => { this.state.editing = item.id; this.state.phase = 'steps'; this.render(); }); const remove = el('button', 'personalisation__link', 'Remove ×'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${placement.label}`); remove.addEventListener('click', () => { this.state.placements = this.state.placements.filter((entry) => entry !== item); this.state.phase = this.state.placements.length ? 'review' : 'picker'; this.render(); }); heading.append(el('span', null)); heading.lastChild.append(edit, remove); card.append(heading, el('p', null, `Add Text / ${item.text}`), el('p', null, `Select Font / ${item.font}`), el('p', null, `Select Colour / ${item.colour}`)); list.append(card); }); body.append(list); if (this.state.placements.length < 2) { const add = el('button', 'personalisation__button personalisation__button--secondary', '+ Add another placement'); add.type = 'button'; add.addEventListener('click', () => { this.state.phase = 'picker'; this.render(); }); body.append(add); } const submit = el('button', 'personalisation__button personalisation__button--primary', 'Add to Bag'); submit.type = 'button'; submit.addEventListener('click', () => this.addToBag()); footer.append(submit); }

    renderConfirm() { this.confirmLayer = el('div', 'personalisation__confirm'); this.confirmLayer.setAttribute('role', 'alertdialog'); this.confirmLayer.setAttribute('aria-modal', 'true'); const box = el('div', 'personalisation__confirm-box'); const heading = el('h3', null, this.config.messages.close); heading.id = 'personalisation-confirm-title'; this.confirmLayer.setAttribute('aria-labelledby', heading.id); this.confirmLayer.setAttribute('aria-describedby', heading.id); this.confirmYes = el('button', 'personalisation__button personalisation__button--primary', 'Yes, close'); this.confirmYes.type = 'button'; this.confirmYes.addEventListener('click', () => this.close(true)); const keep = el('button', 'personalisation__button personalisation__button--secondary', 'Keep editing'); keep.type = 'button'; keep.addEventListener('click', () => { this.state.confirm = false; this.render(); this.closeButton.focus(); }); box.append(heading, this.confirmYes, keep); this.confirmLayer.append(box); this.dialog.append(this.confirmLayer); }
    showError(message) { this.removeFields(); this.pending = false; this.state.error = message; this.render(); }
    addToBag() { if (!this.variantReady() || !L.validateSelection(this.state.placements, { maxLength: this.config.maxLength, allowedPlacements: this.config.placements.map((item) => item.id) })) { this.state.phase = 'steps'; this.state.editing = this.state.placements.find((item) => !this.valid(item))?.id || this.state.placements[0]?.id; this.state.error = this.config.messages.required; this.render(); return; } this.removeFields(); const properties = L.buildProperties(this.state.placements, L.newId()); Object.entries(properties).forEach(([key, value]) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = `properties[${key}]`; input.value = value; input.dataset.personalisationField = ''; input.setAttribute('form', this.dataset.formId); this.form.append(input); }); this.pending = true; this.form.requestSubmit(); }
    removeFields() { this.form?.querySelectorAll('[data-personalisation-field]').forEach((input) => input.remove()); }
    cartSuccess() { this.removeFields(); this.pending = false; this.close(true); }
  }
  if (!customElements.get('personalisation-drawer')) customElements.define('personalisation-drawer', PersonalisationDrawer);
})();
