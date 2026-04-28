// assets/js/main.js

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

async function loadComponent(id, url) {
  const el = document.getElementById(id);
  if (!el) return;

  try {
    const res = await fetch(url, { cache: "no-store" });
    el.innerHTML = await res.text();

    // Notify navbar loaded
    if (id === 'lcNavbar') {
      window.dispatchEvent(new Event("lc:navbar-loaded"));
    }
  } catch (e) {
    el.innerHTML = `<div class="alert alert-warning m-0 rounded-0">
      Navbar/Footer requires a local server (e.g., VS Code Live Server).
    </div>`;
  }
}

function formatINR(amount) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch (_) {
    return `₹${amount}`;
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem('lc_cart') || '[]');
}

function setCart(cart) {
  localStorage.setItem('lc_cart', JSON.stringify(cart));
  updateNavCartCount();
}

function updateNavCartCount() {
  const count = getCart().reduce((s, it) => s + (it.qty || 0), 0);
  const el = document.getElementById('navCartCount');
  if (el) el.textContent = String(count);
}

function getQueryParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('lcNavbar', 'components/navbar.html');
  await loadComponent('lcFooter', 'components/footer.html');

  setTimeout(updateNavCartCount, 50);
});