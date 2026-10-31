import { el, state, pageUrl, collectionUrl, productUrl } from './core.js';
import { subtotal, formatPrice, findProduct } from './store.mjs';
import { checkoutTotals, splitPayments } from './payment-plan.mjs';

let selected = 'mintpay';
const METHODS = [
  { id: 'mintpay', name: 'Mintpay', logo: 'assets/payments/mintpay.png', text: 'Pay in 3 instalments' },
  { id: 'koko', name: 'Koko', logo: 'assets/payments/koko.png', text: 'Pay in 3 instalments' },
  { id: 'cod', name: 'Cash on delivery', text: 'Pay when your order arrives' },
];

export function renderCheckout() {
  document.title = 'Checkout preview · 2202 Love Colombo';
  window.__rerenderCheckout = renderCheckout;
  const root = document.getElementById('page-root');
  const out = el('section', { class: 'page-body demo-checkout' },
    el('a', { class: 'text-link', href: pageUrl('cart.html'), text: 'Back to bag' }),
    el('header', { class: 'page-title' }, el('h1', { class: 'page-title-text', text: 'Checkout' })),
    el('p', { class: 'checkout-preview-notice', text: 'Demo checkout — no real payment is taken and no order is placed.' }),
  );
  if (!['signature', 'edge'].includes(state.concept) || !state.cart.length) {
    out.append(el('p', { text: state.cart.length ? 'Use Demo 4 or Demo 5 to explore the checkout preview.' : 'Your bag is empty.' }),
      el('a', { class: 'btn', href: collectionUrl('all'), text: 'Continue shopping' }));
    root.replaceChildren(out);
    return;
  }
  const totals = checkoutTotals(subtotal(state.cart));
  const summary = el('aside', { class: 'checkout-summary', 'aria-label': 'Order summary' }, el('h2', { text: 'Your order' }));
  for (const line of state.cart) {
    const product = findProduct(state.data, line.id);
    summary.append(el('div', { class: 'checkout-item' },
      product ? el('img', { src: product.image.src, alt: line.name, width: '72', height: '90' }) : null,
      el('div', {}, el('a', { href: productUrl(line.id), text: line.name }),
        el('p', { text: `${line.size || 'One size'} · Qty ${line.qty}` }),
        ...(line.pers?.placements ?? []).map((placement) => el('p', { text: `${placement.label}: ${placement.text} · ${placement.fontLabel} · ${placement.colorLabel}` }))),
      el('strong', { text: formatPrice((line.price + (line.fee ?? 0)) * line.qty) }),
    ));
  }
  const row = (label, value, className = '') => el('div', { class: `checkout-total-row ${className}` }, el('span', { text: label }), el('strong', { text: value }));
  summary.append(
    row('Subtotal', formatPrice(totals.subtotal)),
    row('Delivery', totals.shipping ? formatPrice(totals.shipping) : 'Free'),
    row('Total', formatPrice(totals.total), 'checkout-grand-total'),
    el('p', { class: 'checkout-small', text: 'Sri Lanka delivery: Rs 400. Free from Rs 5,000. No discounts applied in this preview.' }),
  );
  const methods = el('fieldset', { class: 'checkout-payment-methods' }, el('legend', { text: 'Payment method' }));
  const details = el('div', { class: 'checkout-payment-details', id: 'checkout-payment-details', 'aria-live': 'polite' });
  const flow = el('div', { class: 'checkout-payment-flow' });
  const action = el('button', { class: 'btn checkout-continue', type: 'button' });
  const success = el('div', { class: 'checkout-demo-result', role: 'status', tabindex: '-1', hidden: '' });

  function refreshMethod() {
    success.hidden = true;
    flow.replaceChildren();
    action.hidden = false;
    const method = METHODS.find((m) => m.id === selected);
    methods.querySelectorAll('.checkout-method').forEach((label) => label.classList.toggle('is-selected', label.dataset.method === selected));
    details.replaceChildren(el('h3', { text: selected === 'cod' ? 'Pay on delivery' : `Your ${method.name} payment plan` }));
    if (selected === 'cod') details.append(el('p', { text: `${formatPrice(totals.total)} due on delivery. This is a preview only.` }));
    else {
      const schedule = el('ol', { class: 'checkout-schedule' });
      splitPayments(totals.total).forEach((amount, i) => schedule.append(el('li', {},
        el('span', { text: ['First payment', 'Second payment', 'Third payment'][i] }),
        el('strong', { text: formatPrice(amount) }),
      )));
      details.append(schedule, el('p', { class: 'checkout-small', text: 'Illustrative schedule including delivery. Actual eligibility and payment dates are confirmed by the provider.' }));
    }
    action.textContent = selected === 'cod' ? 'Preview cash on delivery' : `Continue with ${method.name}`;
  }
  for (const method of METHODS) {
    const radio = el('input', { type: 'radio', name: 'payment-method', value: method.id, 'aria-controls': 'checkout-payment-details' });
    radio.checked = selected === method.id;
    radio.addEventListener('change', () => { if (radio.checked) { selected = method.id; refreshMethod(); } });
    methods.append(el('label', { class: 'checkout-method', dataset: { method: method.id } }, radio,
      el('span', { class: 'checkout-method-copy' }, el('strong', { text: method.name }), el('span', { text: method.text })),
      method.logo ? el('img', { src: method.logo, alt: '', width: method.id === 'mintpay' ? '72' : '56', height: '25' }) : null,
    ));
  }
  action.addEventListener('click', () => {
    const method = METHODS.find((m) => m.id === selected);
    action.hidden = true;
    const finish = el('button', { class: 'btn', type: 'button', text: 'Complete demo payment' });
    finish.addEventListener('click', () => {
      flow.replaceChildren();
      success.hidden = false;
      success.replaceChildren(el('h3', { text: 'Demo complete' }),
        el('p', { text: `You previewed ${method.name} for ${formatPrice(totals.total)}. No payment was taken and no order was created. Your bag is unchanged.` }),
        el('a', { class: 'text-link', href: collectionUrl('all'), text: 'Continue shopping' }));
      success.focus();
    });
    flow.replaceChildren(el('h3', { tabindex: '-1', text: `${method.name} payment preview` }),
      el('p', { text: 'On the live store, payment is confirmed through the selected method. You can simulate the final step below.' }), finish);
    flow.querySelector('h3').focus();
  });
  refreshMethod();
  const payment = el('div', { class: 'checkout-main' },
    el('section', { class: 'checkout-delivery' }, el('h2', { text: 'Delivery' }),
      el('p', { text: 'Standard delivery within Sri Lanka' }),
      el('p', { class: 'checkout-small', text: 'This preview uses sample delivery settings. No contact, address or card details are collected.' })),
    methods, details, action, flow, success);
  out.append(el('div', { class: 'checkout-layout' }, payment, summary));
  root.replaceChildren(out);
}
