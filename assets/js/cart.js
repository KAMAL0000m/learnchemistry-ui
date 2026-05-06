// assets/js/cart.js

function requireLoginForCartPage() {
  if (window.location.pathname.includes("cart.html")) {
    if (!getCurrentUser()) window.location.href = "login.html";
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

  // Snapshot minimal details (so cart works even if LC_PRODUCTS is empty)
  const p = (window.LC_PRODUCTS || []).find(x => Number(x.id) === id);
  const snapshot = p ? {
    title: p.title,
    price: p.price,
    exam: p.exam,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl || ""
  } : {};

  if (idx >= 0) {
    cart[idx].qty += qty;
    // enrich existing item if missing fields
    if (!cart[idx].title && snapshot.title) Object.assign(cart[idx], snapshot);
    if (!cart[idx].thumbnailUrl && snapshot.thumbnailUrl) cart[idx].thumbnailUrl = snapshot.thumbnailUrl;
  } else {
    cart.push({ id, qty, ...snapshot });
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

// ---------- Hydration from backend ----------

function deriveExamCategoryFromText(text) {
  const t = (text || "").toLowerCase();

  const isClass =
    t.includes("class 11") || t.includes("class11") || t.includes("class-11") ||
    t.includes("class 12") || t.includes("class12") || t.includes("class-12") ||
    t.includes("class-11-12") || t.includes("11/12") || t.includes("11-12");

  if (isClass) return { exam: "Class 11/12", category: "Class 11/12" };
  if (t.includes("neet")) return { exam: "NEET", category: "NEET" };
  if (t.includes("jee")) return { exam: "JEE", category: "JEE" };
  return { exam: "NEET", category: "NEET" };
}

/**
 * Hydrate missing cart item details from backend on cart page.
 */
async function hydrateCartFromBackendIfNeeded() {
  if (!window.location.pathname.includes("cart.html")) return;

  const cart = getCart();
  if (!cart.length) return;

  const API_BASE = window.LC_API_BASE || "http://localhost:8080";
  const known = new Set((window.LC_PRODUCTS || []).map(p => Number(p.id)));

  const missingIds = cart
    .filter(it =>
      !it.title ||
      typeof it.price !== "number" ||
      !known.has(Number(it.id)) ||
      !it.thumbnailUrl
    )
    .map(it => Number(it.id));

  const ids = Array.from(new Set(missingIds));
  if (!ids.length) return;

  const fetched = [];
  for (const id of ids) {
    try {
      const res = await fetch(`${API_BASE}/v1/courses/${encodeURIComponent(id)}`, {
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) continue;

      const c = await res.json();
      const title = c.title || "";
      const desc = c.description || "";
      const price = Math.round((c.pricePaise || c.price_paise || 0) / 100);
      const meta = deriveExamCategoryFromText(`${title} ${c.slug || ""}`);
      const thumbUrl = c.thumbnailUrl || c.thumbnail_url || "";

      fetched.push({
        id: Number(c.id),
        title,
        exam: meta.exam,
        category: meta.category,
        short: desc ? desc.slice(0, 120) + (desc.length > 120 ? "..." : "") : "",
        description: desc,
        price,
        thumbnailUrl: thumbUrl
      });
    } catch (e) {
      // ignore per-item errors
    }
  }

  if (!fetched.length) return;

  // merge into LC_PRODUCTS
  window.LC_PRODUCTS = window.LC_PRODUCTS || [];
  const byId = new Map(window.LC_PRODUCTS.map(p => [Number(p.id), p]));
  for (const p of fetched) byId.set(Number(p.id), p);
  window.LC_PRODUCTS = Array.from(byId.values());

  // enrich cart snapshot
  const byFetched = new Map(fetched.map(p => [Number(p.id), p]));
  const updatedCart = cart.map(it => {
    const fp = byFetched.get(Number(it.id));
    if (!fp) return it;
    return {
      ...it,
      title: fp.title,
      price: fp.price,
      exam: fp.exam,
      category: fp.category,
      thumbnailUrl: fp.thumbnailUrl || ""
    };
  });

  setCart(updatedCart);
}

/**
 * Always return cart items with a product object.
 */
function cartItemsDetailed() {
  const products = window.LC_PRODUCTS || [];
  const byId = new Map(products.map(p => [Number(p.id), p]));

  return getCart().map(it => {
    const id = Number(it.id);
    const p = byId.get(id);

    const fallback = {
      id,
      title: it.title || `Course #${id}`,
      price: typeof it.price === "number" ? it.price : 0,
      exam: it.exam || "—",
      category: it.category || "—",
      thumbnailUrl: it.thumbnailUrl || ""
    };

    return {
      ...it,
      id,
      qty: Number(it.qty || 1),
      product: p || fallback
    };
  });
}

function cartTotals() {
  const items = cartItemsDetailed();
  const subtotal = items.reduce((s, it) => s + (it.product.price || 0) * it.qty, 0);
  const discount = subtotal >= 499 ? Math.round(subtotal * 0.05) : 0;
  const platformFee = 0;
  const total = Math.max(0, subtotal - discount + platformFee);
  return { subtotal, discount, platformFee, total };
}

// Run hydration automatically on cart page
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.includes("cart.html")) return;
  await hydrateCartFromBackendIfNeeded();
});