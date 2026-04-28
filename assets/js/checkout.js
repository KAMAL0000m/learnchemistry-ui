// assets/js/checkout.js

document.addEventListener('DOMContentLoaded', ()=>{
  const itemsRoot = qs('#checkoutItems');
  const totalsRoot = qs('#checkoutTotals');

  const items = cartItemsDetailed();
  if(items.length===0){
    itemsRoot.innerHTML = `<div class="alert alert-info">No items in cart. <a href="shop.html">Browse notes</a>.</div>`;
    totalsRoot.innerHTML = '';
    qs('#btnPay').disabled = true;
    return;
  }

  itemsRoot.innerHTML = items.map(it=>`
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <div class="fw-semibold">${it.product.title}</div>
        <div class="text-muted small">Qty: ${it.qty}</div>
      </div>
      <div class="fw-semibold">${formatINR(it.product.price*it.qty)}</div>
    </div>
  `).join('');

  const t = cartTotals();
  totalsRoot.innerHTML = `
    <div class="d-flex justify-content-between"><span>Subtotal</span><span>${formatINR(t.subtotal)}</span></div>
    <div class="d-flex justify-content-between text-success"><span>Discount</span><span>- ${formatINR(t.discount)}</span></div>
    <div class="d-flex justify-content-between"><span>Platform fee</span><span>${formatINR(t.platformFee)}</span></div>
    <hr />
    <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${formatINR(t.total)}</span></div>
  `;

  qs('#btnPay').addEventListener('click', (e)=>{
    e.preventDefault();

    // Backend integration points:
    // 1) POST /create-order
    // 2) Open Razorpay checkout
    // 3) POST /verify-payment

    const name = qs('#inputName').value.trim();
    const email = qs('#inputEmail').value.trim();
    if(!name || !email){
      qs('#checkoutMsg').innerHTML = `<div class="alert alert-warning">Please fill name and email.</div>`;
      return;
    }

    const order = {
      id: 'LC' + Date.now(),
      name, email,
      items: items.map(i=>({id:i.product.id, title:i.product.title, qty:i.qty, price:i.product.price})),
      total: t.total,
      createdAt: new Date().toISOString(),
      status: 'PAID (SIMULATED)'
    };

    const orders = JSON.parse(localStorage.getItem('lc_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('lc_orders', JSON.stringify(orders));
    setCart([]);

    window.location.href = 'dashboard.html?paid=1';
  });
});
