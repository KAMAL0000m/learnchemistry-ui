// assets/js/cart-page.js

document.addEventListener('DOMContentLoaded', ()=>{
  const listRoot = qs('#cartItems');
  const totalsRoot = qs('#cartTotals');

  function render(){
    const items = cartItemsDetailed();
    if(items.length===0){
      listRoot.innerHTML = `<div class="alert alert-info">Your cart is empty. <a href="shop.html">Browse notes</a>.</div>`;
      totalsRoot.innerHTML = '';
      return;
    }

    listRoot.innerHTML = items.map(it=>`
      <div class="card note-card mb-3">
        <div class="card-body">
          <div class="d-flex flex-column flex-md-row gap-3 align-items-md-center">
            <img src="assets/images/note-cover.svg" class="rounded" style="width:92px;height:92px;object-fit:cover" alt="cover" />
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between gap-2">
                <div>
                  <h5 class="mb-1">${it.product.title}</h5>
                  <div class="text-muted small">${it.product.exam} • ${it.product.category}</div>
                </div>
                <div class="price">${formatINR(it.product.price)}</div>
              </div>
              <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                <div class="input-group" style="width:140px;">
                  <span class="input-group-text">Qty</span>
                  <input type="number" min="1" class="form-control" value="${it.qty}" data-qty="${it.product.id}">
                </div>
                <button class="btn btn-outline-danger" data-remove="${it.product.id}"><i class="bi bi-trash"></i> Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    qsa('[data-remove]').forEach(b=>b.addEventListener('click', ()=>{ removeFromCart(parseInt(b.dataset.remove,10)); render(); }));
    qsa('[data-qty]').forEach(i=>i.addEventListener('change', ()=>{ updateQty(parseInt(i.dataset.qty,10), i.value); render(); }));

    const t = cartTotals();
    totalsRoot.innerHTML = `
      <div class="card note-card">
        <div class="card-body">
          <h5 class="mb-3">Price Details</h5>
          <div class="d-flex justify-content-between"><span>Subtotal</span><span>${formatINR(t.subtotal)}</span></div>
          <div class="d-flex justify-content-between text-success"><span>Discount</span><span>- ${formatINR(t.discount)}</span></div>
          <div class="d-flex justify-content-between"><span>Platform fee</span><span>${formatINR(t.platformFee)}</span></div>
          <hr />
          <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${formatINR(t.total)}</span></div>
          <a class="btn btn-primary w-100 mt-3" href="checkout.html">Proceed to Checkout</a>
        </div>
      </div>
    `;
  }

  render();
});
