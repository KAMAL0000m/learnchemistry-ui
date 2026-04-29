// assets/js/cart.js

function requireLoginForCartPage() {
  if (window.location.pathname.includes("cart.html")) {
    if (!getCurrentUser()) {
      window.location.href = "login.html";
    }
  }
}

document.addEventListener("DOMContentLoaded", requireLoginForCartPage);

function addToCart(productId, qty = 1) {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please login to use cart", "error");
    return;
  }

  const id = Number(productId);
  const cart = getCart();
  const idx = cart.findIndex(x => Number(x.id) === id);

  // Try to snapshot minimal product details (so cart works even without LC_PRODUCTS)
  const p = (window.LC_PRODUCTS || []).find(x => Number(x.id) === id);
  const snapshot = p ? {
    title: p.title,
    price: p.price,
    exam: p.exam,
    category: p.category
  } : null;

  if (idx >= 0) {
    cart[idx].qty += qty;
    // if snapshot exists and old item doesn't have it, add it
    if (snapshot && !cart[idx].title) {
      Object.assign(cart[idx], snapshot);
    }
  } else {
    cart.push({
      id,
      qty,
      ...(snapshot || {})
    });
  }

  setCart(cart);
  showToast("Added to cart successfully");
}

function removeFromCart(productId) {
  const id = Number(productId);
  setCart(getCart().filter(x => Number(x.id) !== id));
}

function updateQty(productId, qty) {
  qty = Math.max(1, parseInt(qty || "1", 10));
  const id = Number(productId);

  const cart = getCart();
  const it = cart.find(x => Number(x.id) === id);
  if (it) {
    it.qty = qty;
    setCart(cart);
  }
}

/**
 * ✅ Hydrate missing cart item details from backend on cart page.
 * If cart items don't have title/price and LC_PRODUCTS doesn't have the product,
 * fetch it from GET /v1/courses/{id} and then store into cart (localStorage).
 */
async function hydrateCartFromBackendIfNeeded() {
  if (!window.location.pathname.includes("cart.html")) return;

  const cart = getCart();
  if (!cart.length) return;

  const API_BASE = (window.LC_API_BASE || "http://localhost:8080");

  // Build a set of IDs already known in window.LC_PRODUCTS
  const known = new Set((window.LC_PRODUCTS || []).map(p => Number(p.id)));

  // Find cart items missing required info or not known in LC_PRODUCTS
  const missingIds = cart
    .filter(it => !it.title || typeof it.price !== "number" || !known.has(Number(it.id)))
    .map(it => Number(it.id));

  const uniqueMissing = Array.from(new Set(missingIds));
  if (!uniqueMissing.length) return;

  // Fetch missing courses in parallel
  const fetchedProducts = [];
  for (const id of uniqueMissing) {
    try {
      const res = await fetch(`${API_BASE}/v1/courses/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) continue;
      const c = await res.json();

      // Normalize to your UI product model
      const title = c.title || "";
      const desc = c.description || "";
      const price = Math.round((c.pricePaise || 0) / 100);

      const meta = deriveExamCategoryFromText(`${title} ${c.slug || ""}`);

      fetchedProducts.push({
        id: Number(c.id),
        title,
        exam: meta.exam,
        category: meta.category,
        badge: meta.exam,
        short: desc ? desc.slice(0, 120) + (desc.length > 120 ? "..." : "") : "",
        description: desc,
        price,
        pages: 0,
        chapters: []
      });
    } catch (_) {
      // ignore network errors per-item
    }
  }

  if (!fetchedProducts.length) return;

  // Merge into window.LC_PRODUCTS
  window.LC_PRODUCTS = window.LC_PRODUCTS || [];
  const byId = new Map(window.LC_PRODUCTS.map(p => [Number(p.id), p]));
  for (const p of fetchedProducts) byId.set(Number(p.id), p);
  window.LC_PRODUCTS = Array.from(byId.values());

  // Also enrich cart items (snapshot) so cart remains stable
  const byFetched = new Map(fetchedProducts.map(p => [Number(p.id), p]));
  const updatedCart = cart.map(it => {
    const id = Number(it.id);
    const fp = byFetched.get(id);
    if (!fp) return it;

    return {
      ...it,
      title: fp.title,
      price: fp.price,
      exam: fp.exam,
      category: fp.category
    };
  });

  setCart(updatedCart);
}

/**
 * Helper used by hydrateCartFromBackendIfNeeded
 * (same logic as shop/product pages)
 */
function deriveExamCategoryFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("neet")) return { exam: "NEET", category: "NEET" };
  if (t.includes("jee")) return { exam: "JEE", category: "JEE" };
  if (t.includes("class 11") || t.includes("class11")) return { exam: "Class 11/12", category: "Class 11/12" };
  if (t.includes("class 12") || t.includes("class12")) return { exam: "Class 11/12", category: "Class 11/12" };
  return { exam: "NEET", category: "NEET" };
}

/**
 * ✅ IMPORTANT FIX:
 * Do NOT filter out items when product is missing.
 * Instead, create a product object either from:
 * - window.LC_PRODUCTS
 * - OR cart snapshot (title/price stored in cart)
 */
function cartItemsDetailed() {
  const products = (window.LC_PRODUCTS || []);
  const byId = new Map(products.map(p => [Number(p.id), p]));

  return getCart().map(it => {
    const id = Number(it.id);
    const productFromList = byId.get(id);

    // fallback product from cart snapshot
    const fallbackProduct = {
      id,
      title: it.title || `Course #${id}`,
      price: typeof it.price === "number" ? it.price : 0,
      exam: it.exam || "—",
      category: it.category || "—"
    };

    return {
      ...it,
      id,
      qty: Number(it.qty || 1),
      product: productFromList || fallbackProduct
    };
  });
}

function cartTotals() {
  const items = cartItemsDetailed();
  const subtotal = items.reduce((s, it) => s + (it.product.price || 0) * it.qty, 0);
  const discount = subtotal >= 499 ? Math.round(subtotal * 0.05) : 0;
  const platformFee = subtotal > 0 ? 0 : 0;
  const total = Math.max(0, subtotal - discount + platformFee);
  return { subtotal, discount, platformFee, total };
}

// ✅ Run hydration automatically when cart page opens
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.includes("cart.html")) return;

  await hydrateCartFromBackendIfNeeded();

  // If you have a render function elsewhere, call it here.
  // Example (only if you have it):
  // if (typeof renderCartPage === "function") renderCartPage();

  // Otherwise, your existing cart page render (if any) will now see non-empty items.
});
