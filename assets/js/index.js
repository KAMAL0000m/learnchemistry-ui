// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const API = (window.LC_API_BASE || "http://localhost:8080");

  const featuredGrid = document.getElementById("featuredGrid");
  const popularTitle = document.getElementById("popularTitle");
  const popularPrice = document.getElementById("popularPrice");
  const popularLink = document.getElementById("popularLink");
  const popularMsg = document.getElementById("popularMsg");

  if (!featuredGrid) return;

  featuredGrid.innerHTML = `<div class="col-12"><div class="alert alert-info">Loading featured notes...</div></div>`;

  try {
    const res = await fetch(`${API}/v1/courses?page=1&limit=20`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Index courses fetch failed:", res.status, text);
      featuredGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load featured notes.</div></div>`;
      if (popularTitle) popularTitle.textContent = "Unavailable";
      if (popularMsg) popularMsg.textContent = "Backend not reachable.";
      return;
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);

    if (!items.length) {
      featuredGrid.innerHTML = `<div class="col-12"><div class="alert alert-warning">No courses available.</div></div>`;
      if (popularTitle) popularTitle.textContent = "No courses yet";
      if (popularPrice) popularPrice.textContent = "—";
      if (popularLink) popularLink.href = "shop.html";
      return;
    }

    // Featured = first 3 items
    const featured = items.slice(0, 3);
    featuredGrid.innerHTML = featured.map(c => {
      const priceInr = Math.round((c.pricePaise || 0) / 100);
      const badge = deriveBadge(c.title || "", c.slug || "");
      return `
        <div class="col-md-4">
          <div class="card note-card h-100">
            <img class="note-thumb" src="assets/images/note-cover.svg" alt="cover" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="mb-1">${escapeHtml(c.title || "")}</h5>
                <span class="badge text-bg-warning">${escapeHtml(badge)}</span>
              </div>
              <div class="text-muted small mb-2">${escapeHtml(badge)}</div>
              <p class="text-muted">${escapeHtml((c.description || "").slice(0, 120))}${(c.description || "").length > 120 ? "..." : ""}</p>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="price">${escapeHtml(formatINR(priceInr))}</div>
                <a class="btn btn-primary btn-sm" href="product.html?id=${encodeURIComponent(c.id)}">View</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Popular pack = first item
    const top = items[0];
    const topPriceInr = Math.round((top.pricePaise || 0) / 100);

    if (popularTitle) popularTitle.textContent = top.title || "Popular Pack";
    if (popularPrice) popularPrice.textContent = formatINR(topPriceInr);
    if (popularLink) popularLink.href = `product.html?id=${encodeURIComponent(top.id)}`;
    if (popularMsg) popularMsg.textContent = "";

  } catch (e) {
    console.error(e);
    featuredGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Network error loading featured notes.</div></div>`;
    if (popularTitle) popularTitle.textContent = "Unavailable";
    if (popularMsg) popularMsg.textContent = "Network error.";
  }
});

function deriveBadge(title, slug) {
  const t = (title + " " + slug).toLowerCase();
  if (t.includes("neet")) return "NEET";
  if (t.includes("jee")) return "JEE";
  if (t.includes("class 11") || t.includes("class11") || t.includes("class 12") || t.includes("class12")) return "Class 11/12";
  return "Chemistry";
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}