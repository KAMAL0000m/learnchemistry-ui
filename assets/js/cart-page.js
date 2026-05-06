// assets/js/cart-page.js
// Renders cart items + totals (with thumbnails)

document.addEventListener("DOMContentLoaded", async () => {
  const listRoot = qs("#cartItems");
  const totalsRoot = qs("#cartTotals");
  const API_BASE = window.LC_API_BASE || "http://localhost:8080";

  // ✅ wait for hydration so items have title/price/thumb
  if (typeof hydrateCartFromBackendIfNeeded === "function") {
    await hydrateCartFromBackendIfNeeded();
  }

  function buildThumbSrc(thumbnailUrl) {
    if (thumbnailUrl && String(thumbnailUrl).trim().length > 0) {
      return `${API_BASE}${thumbnailUrl}?v=${Date.now()}`;
    }
    return "assets/images/note-cover.svg";
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/`/g, "&#096;");
  }

  function render() {
    const items = cartItemsDetailed();

    if (!items.length) {
      listRoot.innerHTML =
        `<div class="alert alert-info">Your cart is empty. <a href="shop.html">Browse notes</a>.</div>`;
      totalsRoot.innerHTML = "";
      return;
    }

    listRoot.innerHTML = items.map(it => {
      const p = it.product || {};
      const imgSrc = buildThumbSrc(p.thumbnailUrl);

      return `
        <div class="card note-card mb-3">
          <div class="card-body">
            <div class="d-flex flex-column flex-md-row gap-3 align-items-md-center">
              <img
                src="${escapeAttr(imgSrc)}"
                class="rounded"
                style="width:92px;height:92px;object-fit:cover;flex:0 0 auto;"
                alt="cover"
                onerror="this.onerror=null;this.src='assets/images/note-cover.svg';"
              />

              <div class="flex-grow-1">
                <div class="d-flex justify-content-between gap-2">
                  <div>
                    <h5 class="mb-1">${escapeHtml(p.title || "")}</h5>
                    <div class="text-muted small">${escapeHtml(p.exam || "—")} • ${escapeHtml(p.category || "—")}</div>
                  </div>
                  <div class="price">${escapeHtml(formatINR(p.price || 0))}</div>
                </div>

                <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                  <div class="input-group" style="width:140px;">
                    <span class="input-group-text">Qty</span>
                    <input
                      type="number"
                      min="1"
                      class="form-control"
                      value="${it.qty}"
                      data-qty="${escapeAttr(String(p.id))}"
                    />
                  </div>

                  <button class="btn btn-outline-danger" data-remove="${escapeAttr(String(p.id))}">
                    <i class="bi bi-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // handlers
    qsa("[data-remove]").forEach(b =>
      b.addEventListener("click", () => {
        removeFromCart(parseInt(b.dataset.remove, 10));
        render();
      })
    );

    qsa("[data-qty]").forEach(i =>
      i.addEventListener("change", () => {
        updateQty(parseInt(i.dataset.qty, 10), i.value);
        render();
      })
    );

    const t = cartTotals();

    totalsRoot.innerHTML = `
      <div class="card note-card sticky-top" style="top: 90px;">
        <div class="card-body">
          <h5 class="mb-3">Price Details</h5>

          <div class="d-flex justify-content-between">
            <span>Subtotal</span>
            <span>${escapeHtml(formatINR(t.subtotal))}</span>
          </div>

          <div class="d-flex justify-content-between text-success">
            <span>Discount</span>
            <span>- ${escapeHtml(formatINR(t.discount))}</span>
          </div>

          <div class="d-flex justify-content-between">
            <span>Platform fee</span>
            <span>${escapeHtml(formatINR(t.platformFee))}</span>
          </div>

          <hr />

          <div class="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>${escapeHtml(formatINR(t.total))}</span>
          </div>

          <a class="btn btn-primary w-100 mt-3" href="checkout.html">Proceed to Checkout</a>
        </div>
      </div>
    `;
  }

  render();
});
