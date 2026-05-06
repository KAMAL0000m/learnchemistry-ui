// assets/js/product.js
// Loads product from backend if not found in LC_PRODUCTS
// ✅ Fixes exam/category detection for "Class 11/12" (including slug like class-11-12)
// ✅ Shows thumbnail only when available (no placeholder text/icon)
// ✅ DOES NOT reference removed elements (#pPages/#pChaptersCount)

function deriveExamCategory(text) {
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

async function fetchCourse(id) {
  const API = window.LC_API_BASE || "http://localhost:8080";
  const res = await fetch(`${API}/v1/courses/${encodeURIComponent(id)}`, {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Not found (HTTP ${res.status}) ${txt}`);
  }
  return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = qs("#productRoot");
  const id = Number(getQueryParam("id"));

  if (!id || id <= 0) {
    root.innerHTML = `<div class="alert alert-danger">Invalid product id.</div>`;
    return;
  }

  let p = (window.LC_PRODUCTS || []).find(x => Number(x.id) === id);

  if (!p) {
    try {
      const c = await fetchCourse(id);
      const meta = deriveExamCategory(`${c.title || ""} ${c.slug || ""}`);

      const pricePaise = Number(c.pricePaise ?? c.price_paise ?? 0);
      const priceInr = Math.round(pricePaise / 100);

      const thumbUrl = c.thumbnailUrl || c.thumbnail_url || "";

      p = {
        id: Number(c.id),
        title: c.title || "",
        exam: meta.exam,
        category: meta.category,
        short: (c.description || "").slice(0, 140),
        description: c.description || "",
        price: priceInr,
        thumbnailUrl: thumbUrl,
        pages: 0,
        chapters: []
      };

      // inject/update into LC_PRODUCTS
      window.LC_PRODUCTS = window.LC_PRODUCTS || [];
      const idx = window.LC_PRODUCTS.findIndex(x => Number(x.id) === id);
      if (idx >= 0) window.LC_PRODUCTS[idx] = p;
      else window.LC_PRODUCTS.push(p);

    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="alert alert-danger">Product not found.</div>`;
      return;
    }
  }

  // ===== Render =====
  qs("#pTitle").textContent = p.title;
  qs("#pMeta").textContent = `${p.exam} • ${p.category}`;
  qs("#pPrice").textContent = formatINR(p.price);
  qs("#pShort").textContent = p.short || "";
  qs("#pDesc").textContent = p.description || "";

  // ✅ You removed pages/chapters chips from HTML, so we don't touch them anymore.
  // ✅ Still keep chapters list placeholder
  qs("#chapterList").innerHTML = `<li class="list-group-item text-muted">Details coming soon</li>`;

  // ===== Left preview thumbnail =====
  const img = document.getElementById("pPreviewImg");
  const API = window.LC_API_BASE || "http://localhost:8080";

  if (img) {
    if (p.thumbnailUrl && String(p.thumbnailUrl).trim().length > 0) {
      img.src = `${API}${p.thumbnailUrl}?v=${Date.now()}`;
      img.style.display = "block";
      img.onerror = () => {
        // if thumbnail fails, just hide the image (no text/icon)
        img.style.display = "none";
      };
    } else {
      img.style.display = "none";
    }
  }

  // ===== Require Login =====
  function requireLogin() {
    if (!getCurrentUser()) {
      showToast("Please login first", "error");
      setTimeout(() => (location.href = "login.html"), 800);
      return false;
    }
    return true;
  }

  qs("#btnAddToCart").onclick = () => requireLogin() && addToCart(p.id, 1);
  qs("#btnBuyNow").onclick = () => {
    if (!requireLogin()) return;
    addToCart(p.id, 1);
    location.href = "cart.html";
  };
});