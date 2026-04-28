// assets/js/main.js

// ===== DOM HELPERS =====
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// ===== COMPONENT LOADER (SAFE) =====
let navbarLoaded = false;
let footerLoaded = false;

async function loadComponent(id, url) {
  const el = document.getElementById(id);
  if (!el) return;

  // 🔥 Prevent multiple loads (VERY IMPORTANT)
  if (id === "lcNavbar" && navbarLoaded) return;
  if (id === "lcFooter" && footerLoaded) return;

  try {
    const res = await fetch(url, { cache: "no-store" });
    el.innerHTML = await res.text();

    // Mark as loaded
    if (id === "lcNavbar") {
      navbarLoaded = true;
      window.dispatchEvent(new Event("lc:navbar-loaded"));
    }

    if (id === "lcFooter") {
      footerLoaded = true;
    }

  } catch (e) {
    el.innerHTML = `<div class="alert alert-warning m-0 rounded-0">
      Navbar/Footer requires a local server (e.g., VS Code Live Server).
    </div>`;
  }
}

// ===== FORMAT =====
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

// ===== GLOBAL TOAST =====
function showToast(message, type = "success") {
  const toastEl = document.getElementById("addedToast");
  if (!toastEl) return;

  const body = toastEl.querySelector(".toast-body");
  const header = toastEl.querySelector(".toast-header strong");

  body.textContent = message;
  header.textContent = type === "error" ? "Error" : "Cart";

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// ===== USER =====
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('lc_user') || 'null');
  } catch {
    return null;
  }
}

// ===== CART (USER-SPECIFIC) =====
function getCartKey() {
  const user = getCurrentUser();
  return user?.userId ? `lc_cart_${user.userId}` : null;
}

function getCart() {
  const key = getCartKey();
  if (!key) return [];
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function setCart(cart) {
  const key = getCartKey();
  if (!key) return;

  localStorage.setItem(key, JSON.stringify(cart));
  updateNavCartCount();
}

function clearCart() {
  const key = getCartKey();
  if (key) localStorage.removeItem(key);
}

// ===== NAV CART COUNT =====
function updateNavCartCount() {
  const el = document.getElementById('navCartCount');
  if (!el) return;

  const user = getCurrentUser();

  if (!user) {
    el.textContent = "0";
    return;
  }

  const cart = getCart();
  const count = cart.reduce((s, it) => s + (it.qty || 0), 0);

  el.textContent = String(count);
}

// ===== QUERY PARAM =====
function getQueryParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('lcNavbar', 'components/navbar.html');
  await loadComponent('lcFooter', 'components/footer.html');

  // small delay ensures navbar is rendered
  setTimeout(updateNavCartCount, 50);
});