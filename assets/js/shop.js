// assets/js/shop.js
// Uses backend /v1/courses and syncs data to window.LC_PRODUCTS

let LC_ALL_COURSES = [];

function deriveExamCategoryFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("neet")) return { exam: "NEET", category: "NEET" };
  if (t.includes("jee")) return { exam: "JEE", category: "JEE" };
  if (t.includes("class 11") || t.includes("class11")) return { exam: "Class 11/12", category: "Class 11/12" };
  if (t.includes("class 12") || t.includes("class12")) return { exam: "Class 11/12", category: "Class 11/12" };
  return { exam: "NEET", category: "NEET" };
}

function normalizeCourse(c) {
  const { exam, category } = deriveExamCategoryFromText(`${c.title} ${c.slug}`);
  const price = Math.round((c.pricePaise || 0) / 100);

  return {
    id: Number(c.id),
    title: c.title,
    exam,
    category,
    badge: exam,
    short: c.description?.slice(0, 120) || "",
    description: c.description || "",
    price,
    pages: 0,
    chapters: [],
    isActive: c.isActive !== false
  };
}

async function fetchCoursesFromBackend() {
  const grid = qs("#productGrid");
  const resultCount = qs("#resultCount");
  const API = "http://localhost:8080";

  grid.innerHTML = `<div class="col-12"><div class="alert alert-info">Loading notes…</div></div>`;

  try {
    const res = await fetch(`${API}/v1/courses`);
    const data = await res.json();
    const items = data.items || [];

    LC_ALL_COURSES = items.map(normalizeCourse);

    // ✅ CRITICAL FIX
    window.LC_PRODUCTS = LC_ALL_COURSES.slice();

    applyFilters();
  } catch (e) {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load notes</div></div>`;
    console.error(e);
  }
}

function renderShop(list) {
  const grid = qs("#productGrid");
  if (!list.length) {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-info">No notes found</div></div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="col-sm-6 col-lg-4">
      <div class="card note-card h-100">
        <img class="note-thumb" src="assets/images/note-cover.svg" />
        <div class="card-body">
          <h5>${p.title}</h5>
          <div class="text-muted small">${p.exam} • ${p.category}</div>
          <p class="text-muted">${p.short}</p>
          <div class="d-flex justify-content-between">
            <div class="price">${formatINR(p.price)}</div>
            <a class="btn btn-primary btn-sm" href="product.html?id=${p.id}">View</a>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  qs("#resultCount").textContent = `${list.length} item(s)`;
}

function applyFilters() {
  const exam = qs("#filterExam").value;
  const maxPrice = parseInt(qs("#filterPrice").value, 10);
  const query = qs("#searchInput").value.toLowerCase();

  let list = LC_ALL_COURSES.slice();
  if (exam !== "ALL") list = list.filter(p => p.exam === exam);
  list = list.filter(p => p.price <= maxPrice);
  if (query) list = list.filter(p => p.title.toLowerCase().includes(query));

  renderShop(list);
}

document.addEventListener("DOMContentLoaded", () => {
  qsa("#filterExam, #filterPrice").forEach(el => el.addEventListener("change", applyFilters));
  qs("#searchInput").addEventListener("input", applyFilters);
  qs("#btnReset").addEventListener("click", () => {
    qs("#filterExam").value = "ALL";
    qs("#filterPrice").value = "99999";
    qs("#searchInput").value = "";
    applyFilters();
  });

  fetchCoursesFromBackend();
});