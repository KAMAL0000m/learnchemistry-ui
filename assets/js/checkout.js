// assets/js/checkout.js
// Backend-integrated FREE PURCHASE MVP
// Calls: POST /v1/orders/free (JWT protected)

document.addEventListener('DOMContentLoaded', () => {
  const itemsRoot = qs('#checkoutItems');
  const totalsRoot = qs('#checkoutTotals');
  const msgRoot = qs('#checkoutMsg');
  const btnPay = qs('#btnPay');

  const API_BASE = "http://localhost:8080";

  // Require login (checkout is protected)
  const token = localStorage.getItem('lc_token');
  if (!token || !getCurrentUser()) {
    window.location.href = "login.html";
    return;
  }

  // Render cart summary
  const items = cartItemsDetailed();
  if (!items || items.length === 0) {
    itemsRoot.innerHTML = `<div class="alert alert-info">No items in cart. <a href="shop.html">Browse notes</a>.</div>`;
    totalsRoot.innerHTML = '';
    btnPay.disabled = true;
    return;
  }

  itemsRoot.innerHTML = items.map(it => `
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <div class="fw-semibold">${escapeHtml(it.product.title)}</div>
        <div class="text-muted small">Qty: ${it.qty}</div>
      </div>
      <div class="fw-semibold">${formatINR((it.product.price || 0) * it.qty)}</div>
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

  // Click → create free order in backend
  btnPay.addEventListener('click', async (e) => {
    e.preventDefault();

    // Basic user detail validation (optional)
    const name = qs('#inputName')?.value.trim();
    const email = qs('#inputEmail')?.value.trim();
    if (!name || !email) {
      msgRoot.innerHTML = `<div class="alert alert-warning">Please fill name and email.</div>`;
      return;
    }

    // Build payload: send items (id, qty)
    const payload = {
      items: items.map(i => ({ id: Number(i.product.id), qty: Number(i.qty || 1) }))
    };

    btnPay.disabled = true;
    msgRoot.innerHTML = `<div class="alert alert-info">Creating order...</div>`;

    try {
      const res = await fetch(`${API_BASE}/v1/orders/free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error || `Checkout failed (HTTP ${res.status})`;
        msgRoot.innerHTML = `<div class="alert alert-danger">${escapeHtml(errMsg)}</div>`;

        // If token expired/invalid → login again
        if (res.status === 401) {
          setTimeout(() => window.location.href = "login.html", 600);
        }

        btnPay.disabled = false;
        return;
      }

      // Success: clear cart + redirect to dashboard
      setCart([]); // updates nav badge too
      msgRoot.innerHTML = `<div class="alert alert-success">Order created successfully! Redirecting...</div>`;

      const orderId = data.orderId || "";
      setTimeout(() => {
        window.location.href = `dashboard.html?paid=1&orderId=${encodeURIComponent(orderId)}`;
      }, 700);

    } catch (err) {
      msgRoot.innerHTML = `<div class="alert alert-danger">Network error: ${escapeHtml(err.message)}</div>`;
      btnPay.disabled = false;
    }
  });
});

// small HTML escape helper
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}