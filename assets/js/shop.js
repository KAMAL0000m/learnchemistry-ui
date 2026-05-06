// assets/js/shop.js
// Uses backend /v1/courses and syncs data to window.LC_PRODUCTS
// ✅ Uses thumbnailUrl from backend (admin uploaded)

let LC_ALL_COURSES = [];

function deriveExamCategoryFromText(text) {
  const t = (text || "").toLowerCase();

  // ✅ handle many class formats: "class 11", "class11", "class-11", "class-11-12", "11/12", "11-12"
  const isClass = (
    t.includes("class 11") || t.includes("class11") || t.includes("class-11") ||
    t.includes("class 12") || t.includes("class12") || t.includes("class-12") ||
    t.includes("class-11-12") || t.includes("11/12") || t.includes("11-12")
  );
  if (isClass) return { exam: "Class 11/12", category: "Class 11/12" };

  if (t.includes("neet")) return { exam: "NEET", category: "NEET" };
  if (t.includes("jee")) return { exam: "JEE", category: "JEE" };

  return { exam: "NEET", category: "NEET" };
}

// ✅ Build thumbnail src from backend thumbnailUrl like "/v1/thumb/15"
function buildThumbSrc(thumbnailUrl) {
  const API = window.LC_API_BASE || "http://localhost:8080";
  if (thumbnailUrl && String(thumbnailUrl).trim().length > 0) {
    return `${API}${thumbnailUrl}?v=${Date.now()}`; // cache-bust
  }
  return "assets/images/note-cover.svg";
}

function normalizeCourse(c) {
  const { exam, category } = deriveExamCategoryFromText(`${c.title || ""} ${c.slug || ""}`);
  const price = Math.round((c.pricePaise || c.price_paise || 0) / 100);

  const thumbUrl = c.thumbnailUrl || c.thumbnail_url || "";

  return {
    id: Number(c.id),
    title: c.title || "",
    exam,
    category,
    badge: exam,
    short: (c.description || "").slice(0, 120),
    description: c.description || "",
    price,
    thumbnailUrl: thumbUrl,
    pages: 0,
    chapters: [],
    isActive: c.isActive !== false && c.is_active !== 0
  };
}

async function fetchCoursesFromBackend() {
  const grid = qs("#productGrid");
  const resultCount = qs("#resultCount");
  const API = window.LC_API_BASE || "http://localhost:8080";

  if (!grid) return;

  grid.innerHTML = `<div class="col-12"><div class="alert alert-info">Loading notes…</div></div>`;

  try {
    const res = await fetch(`${API}/v1/courses`, {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("GET /v1/courses failed:", res.status, text);
      grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load notes (HTTP ${res.status}).</div></div>`;
      if (resultCount) resultCount.textContent = `0 item(s)`;
      return;
    }

    const data = await res.json().catch(() => ({}));
    const items = Array.isArray(data) ? data : (data.items || []);

    LC_ALL_COURSES = items.map(normalizeCourse).filter(x => x.isActive);

    // ✅ Keep compatibility with cart/product pages
    window.LC_PRODUCTS = LC_ALL_COURSES.slice();

    applyFilters();
  } catch (e) {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Network error: ${escapeHtml(e.message)}</div></div>`;
    console.error(e);
    if (resultCount) resultCount.textContent = `0 item(s)`;
  }
}

function renderShop(list) {
  const grid = qs("#productGrid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-info">No notes found</div></div>`;
    qs("#resultCount").textContent = `0 item(s)`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const imgSrc = buildThumbSrc(p.thumbnailUrl);

    return `
      <div class="col-sm-6 col-lg-4">
        <div class="card note-card h-100">
          <img class="note-thumb" src="${escapeAttr(imgSrc)}" alt="cover"
               onerror="this.onerror=null;this.src='assets/images/note-cover.svg';" />
          <div class="card-body">
            <h5>${escapeHtml(p.title)}</h5>
            <div class="text-muted small">${escapeHtml(p.exam)} • ${escapeHtml(p.category)}</div>
            <p class="text-muted">${escapeHtml(p.short)}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="price">${escapeHtml(formatINR(p.price))}</div>
              <a class="btn btn-primary btn-sm" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  qs("#resultCount").textContent = `${list.length} item(s)`;
}

function applyFilters() {
  const exam = qs("#filterExam")?.value || "ALL";
  const maxPrice = parseInt(qs("#filterPrice")?.value || "99999", 10);
  const query = (qs("#searchInput")?.value || "").toLowerCase();

  let list = LC_ALL_COURSES.slice();

  if (exam !== "ALL") list = list.filter(p => p.exam === exam);
  list = list.filter(p => p.price <= maxPrice);
  if (query) list = list.filter(p => p.title.toLowerCase().includes(query));

  renderShop(list);
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

document.addEventListener("DOMContentLoaded", () => {
  qsa("#filterExam, #filterPrice").forEach(el => el.addEventListener("change", applyFilters));

  qs("#searchInput")?.addEventListener("input", () => {
    clearTimeout(window.__shopT);
    window.__shopT = setTimeout(applyFilters, 120);
  });

  qs("#btnReset")?.addEventListener("click", () => {
    qs("#filterExam").value = "ALL";
    qs("#filterPrice").value = "99999";
    qs("#searchInput").value = "";
    applyFilters();
  });

  fetchCoursesFromBackend();
});