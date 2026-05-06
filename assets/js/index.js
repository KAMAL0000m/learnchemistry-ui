// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const API = window.LC_API_BASE || "http://localhost:8080";

  const featuredGrid = document.getElementById("featuredGrid");

  const popularTitle = document.getElementById("popularTitle");
  const popularPrice = document.getElementById("popularPrice");
  const popularLink = document.getElementById("popularLink");
  const popularThumb = document.getElementById("popularThumb"); // ✅ from updated index.html
  const popularHint = document.getElementById("popularHint");   // optional

  if (!featuredGrid) return;

  featuredGrid.innerHTML =
    `<div class="col-12"><div class="alert alert-info">Loading featured notes…</div></div>`;

  try {
    const res = await fetch(`${API}/v1/courses`, {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${t}`);
    }

    const data = await res.json().catch(() => ({}));
    const courses = Array.isArray(data) ? data : (data.items || []);

    if (!courses.length) {
      featuredGrid.innerHTML =
        `<div class="col-12"><div class="alert alert-warning">No courses available.</div></div>`;
      if (popularTitle) popularTitle.textContent = "No courses yet";
      if (popularPrice) popularPrice.textContent = "—";
      if (popularLink) popularLink.href = "shop.html";
      if (popularThumb) popularThumb.removeAttribute("src");
      if (popularHint) popularHint.textContent = "";
      return;
    }

    // ✅ Popular pack = first course
    const top = courses[0];
    const topPrice = Math.round((top.pricePaise || 0) / 100);

    if (popularTitle) popularTitle.textContent = top.title || "Popular pack";
    if (popularPrice) popularPrice.textContent = formatINR(topPrice);
    if (popularLink) popularLink.href = `product.html?id=${encodeURIComponent(top.id)}`;

    // set popular thumbnail (admin uploaded)
    if (popularThumb) {
      const src = buildThumbSrc(API, top.thumbnailUrl);
      if (src) {
        popularThumb.src = src;
      } else {
        // fallback: keep it empty or set a placeholder image if you want
        popularThumb.removeAttribute("src");
      }
    }

    if (popularHint) {
      popularHint.textContent = top.thumbnailUrl ? "" : "Thumbnail not uploaded yet.";
    }

    // ✅ Featured = first 3
    const featured = courses.slice(0, 3);

    featuredGrid.innerHTML = featured.map(c => {
      const price = Math.round((c.pricePaise || 0) / 100);
      const thumbSrc = buildThumbSrc(API, c.thumbnailUrl);

      return `
        <div class="col-md-4">
          <div class="card note-card h-100">
            ${thumbSrc
              ? `<img src="${thumbSrc}" class="note-thumb" alt="cover" />`
              : ``}
            <div class="card-body">
              <h5 class="mb-1">${escapeHtml(c.title || "")}</h5>
              <p class="text-muted">${escapeHtml((c.description || "").slice(0, 120))}${(c.description || "").length > 120 ? "..." : ""}</p>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="price">${escapeHtml(formatINR(price))}</div>
                <a href="product.html?id=${encodeURIComponent(c.id)}" class="btn btn-primary btn-sm">View</a>
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

    if (popularTitle) popularTitle.textContent = "Unavailable";
    if (popularPrice) popularPrice.textContent = "—";
    if (popularLink) popularLink.href = "shop.html";
    if (popularThumb) popularThumb.removeAttribute("src");
    if (popularHint) popularHint.textContent = "Backend not reachable.";
  }
});

// ✅ Builds a full thumbnail src from backend thumbnailUrl
// backend returns thumbnailUrl like "/v1/thumb/15"
function buildThumbSrc(API, thumbnailUrl) {
  if (!thumbnailUrl || String(thumbnailUrl).trim().length === 0) return "";
  // cache-bust so new uploads show immediately
  return `${API}${thumbnailUrl}?v=${Date.now()}`;
}

// ✅ fixed escapeHtml (your previous mapping was wrong)
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}