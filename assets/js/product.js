// assets/js/product.js
// Loads product from backend if not found in LC_PRODUCTS

function deriveExamCategory(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("neet")) return { exam: "NEET", category: "NEET" };
  if (t.includes("jee")) return { exam: "JEE", category: "JEE" };
  return { exam: "Class 11/12", category: "Class 11/12" };
}

async function fetchCourse(id) {
  const API = "http://localhost:8080";
  const res = await fetch(`${API}/v1/courses/${id}`);
  if (!res.ok) throw new Error("Not found");
  return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = qs("#productRoot");
  const id = Number(getQueryParam("id"));

  let p = (window.LC_PRODUCTS || []).find(x => x.id === id);

  if (!p) {
    try {
      const c = await fetchCourse(id);
      const meta = deriveExamCategory(`${c.title} ${c.slug}`);
      p = {
        id: c.id,
        title: c.title,
        exam: meta.exam,
        category: meta.category,
        short: c.description || "",
        description: c.description || "",
        price: Math.round((c.pricePaise || 0) / 100),
        pages: 0,
        chapters: []
      };

      // ✅ inject into LC_PRODUCTS
      window.LC_PRODUCTS = window.LC_PRODUCTS || [];
      window.LC_PRODUCTS.push(p);
    } catch {
      root.innerHTML = `<div class="alert alert-danger">Product not found.</div>`;
      return;
    }
  }

  qs("#pTitle").textContent = p.title;
  qs("#pMeta").textContent = `${p.exam} • ${p.category}`;
  qs("#pPrice").textContent = formatINR(p.price);
  qs("#pShort").textContent = p.short;
  qs("#pDesc").textContent = p.description;
  qs("#pPages").textContent = `—`;
  qs("#pChaptersCount").textContent = `—`;
  qs("#chapterList").innerHTML = `<li class="list-group-item text-muted">Details coming soon</li>`;

  function requireLogin() {
    if (!getCurrentUser()) {
      showToast("Please login first");
      setTimeout(() => location.href = "login.html", 800);
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