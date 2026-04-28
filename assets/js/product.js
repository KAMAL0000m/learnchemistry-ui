// assets/js/product.js

document.addEventListener('DOMContentLoaded', () => {

  const id = parseInt(getQueryParam('id') || '1', 10);
  const p = (window.LC_PRODUCTS || []).find(x => x.id === id);
  const root = qs('#productRoot');

  if (!p) {
    root.innerHTML = `<div class="alert alert-danger">Product not found.</div>`;
    return;
  }

  // ===== Render Product =====
  qs('#pTitle').textContent = p.title;
  qs('#pMeta').textContent = `${p.exam} • ${p.category}`;
  qs('#pPrice').textContent = formatINR(p.price);
  qs('#pShort').textContent = p.short;
  qs('#pDesc').textContent = p.description;
  qs('#pPages').textContent = `${p.pages} pages`;
  qs('#pChaptersCount').textContent = `${p.chapters.length} chapters`;
  qs('#chapterList').innerHTML =
    p.chapters.map(c => `<li class="list-group-item">${c}</li>`).join('');

  // ===== Helper: Require Login =====
  function requireLogin() {
    if (!getCurrentUser()) {
      showToast("Please login to continue", "error");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);

      return false;
    }
    return true;
  }

  // ===== Add to Cart =====
  qs('#btnAddToCart').addEventListener('click', () => {
    if (!requireLogin()) return;

    addToCart(p.id, 1); // toast handled inside cart.js
  });

  // ===== Buy Now =====
  qs('#btnBuyNow').addEventListener('click', () => {
    if (!requireLogin()) return;

    addToCart(p.id, 1);

    showToast("Redirecting to cart...");
    setTimeout(() => {
      window.location.href = 'cart.html'; // better than checkout for now
    }, 600);
  });

});