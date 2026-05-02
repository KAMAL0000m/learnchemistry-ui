// assets/js/index.js
// Homepage: fetch featured courses from backend DB

document.addEventListener("DOMContentLoaded", async () => {
  const API = window.LC_API_BASE || "http://localhost:8080";

  const featuredGrid = document.getElementById("featuredGrid");
  const popularTitle = document.getElementById("popularTitle");
  const popularPrice = document.getElementById("popularPrice");
  const popularLink = document.getElementById("popularLink");

  featuredGrid.innerHTML =
    `<div class="col-12"><div class="alert alert-info">Loading featured notes…</div></div>`;

  try {
    const res = await fetch(`${API}/v1/courses`, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const courses = data.items || data;

    if (!courses.length) {
      featuredGrid.innerHTML =
        `<div class="col-12"><div class="alert alert-warning">No courses available.</div></div>`;
      return;
    }

    // ✅ Popular pack = first course
    const top = courses[0];
    popularTitle.textContent = top.title;
    popularPrice.textContent = formatINR(Math.round(top.pricePaise / 100));
    popularLink.href = `product.html?id=${top.id}`;

    // ✅ Featured = first 3
    const featured = courses.slice(0, 3);

    featuredGrid.innerHTML = featured.map(c => {
      const price = Math.round(c.pricePaise / 100);
      return `
        <div class="col-md-4">
          <div class="card note-card h-100">
            <img src="assets/images/note-cover.svg" class="note-thumb" />
            <div class="card-body">
              <h5 class="mb-1">${escapeHtml(c.title)}</h5>
              <p class="text-muted">${escapeHtml((c.description || "").slice(0, 120))}</p>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="price">${formatINR(price)}</div>
                <a href="product.html?id=${c.id}" class="btn btn-primary btn-sm">View</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    featuredGrid.innerHTML =
      `<div class="col-12"><div class="alert alert-danger">Failed to load featured notes.</div></div>`;
  }
});

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}