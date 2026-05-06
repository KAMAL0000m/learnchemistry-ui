// assets/js/dashboard.js
// Loads purchased courses from backend: GET /v1/me/courses (JWT protected)

document.addEventListener("DOMContentLoaded", () => {
  bootDashboard().catch(err => {
    console.error("[dashboard] fatal:", err);
    const root = qs("#myNotes");
    if (root) root.innerHTML = `<div class="alert alert-danger">Dashboard error: ${escapeHtml(err.message)}</div>`;
  });
});

async function bootDashboard() {
  const API_BASE = window.LC_API_BASE || "http://localhost:8080";

  const user = safeJson(localStorage.getItem("lc_user"));
  qs("#userEmail").textContent = user?.email || "guest@learnchemistry.in";

  const token = localStorage.getItem("lc_token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  // Success message after checkout redirect
  if (getQueryParam("paid") === "1") {
    const orderId = getQueryParam("orderId");
    qs("#dashMsg").innerHTML = `
      <div class="alert alert-success">
        Purchase successful. Your notes are ready.
        ${orderId ? `<div class="small mt-1 text-muted">Order ID: ${escapeHtml(orderId)}</div>` : ``}
      </div>
    `;
  } else {
    qs("#dashMsg").innerHTML = "";
  }

  await loadMyPurchasedCourses(API_BASE, token);
  renderOrdersPlaceholder();
}

async function loadMyPurchasedCourses(API_BASE, token) {
  const notesRoot = qs("#myNotes");
  notesRoot.innerHTML = `<div class="alert alert-info">Loading your purchases...</div>`;

  const res = await fetch(`${API_BASE}/v1/me/courses`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });

  const data = await res.json().catch(() => ({}));

  // If token invalid/expired => force login
  if (res.status === 401) {
    localStorage.removeItem("lc_token");
    localStorage.removeItem("lc_user");
    window.location.replace("login.html");
    return;
  }

  if (!res.ok) {
    const msg = data.error || `Failed to load purchases (HTTP ${res.status})`;
    notesRoot.innerHTML = `<div class="alert alert-danger">${escapeHtml(msg)}</div>`;
    return;
  }

  const items = data.items || [];
  if (!items.length) {
    notesRoot.innerHTML = `
      <div class="alert alert-info">
        No purchases yet. <a href="shop.html">Browse notes</a>.
      </div>
    `;
    return;
  }

  notesRoot.innerHTML = items.map(c => {
    const title = c.title || "";
    const desc = c.description || "";
    const priceInr = Math.round((c.pricePaise || 0) / 100);
    const enrolledAt = c.enrolledAt || "";

    const thumbSrc = buildThumbSrc(API_BASE, c.thumbnailUrl);

    const thumbHtml = thumbSrc
      ? `<img src="${escapeAttr(thumbSrc)}"
              class="rounded"
              style="width:92px;height:92px;object-fit:cover;flex:0 0 auto;"
              alt="thumbnail"
              onerror="this.onerror=null;this.style.display='none';" />`
      : ``;

    return `
      <div class="card note-card mb-3">
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">
          ${thumbHtml}
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between gap-2">
              <div>
                <h5 class="mb-1">${escapeHtml(title)}</h5>
                <div class="text-muted small">
                  Price: ${escapeHtml(formatINR(priceInr))}
                  ${enrolledAt ? ` • Enrolled: ${escapeHtml(enrolledAt)}` : ``}
                </div>
              </div>
              <span class="badge text-bg-success align-self-start">Purchased</span>
            </div>
            <div class="text-muted small mt-1">
              ${escapeHtml(desc.slice(0, 140))}${desc.length > 140 ? "..." : ""}
            </div>
          </div>
          <button class="btn btn-success" data-download="${escapeAttr(String(c.id))}">
            <i class="bi bi-download"></i> Download
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Attach download handlers
  qsa("[data-download]").forEach(btn => btn.addEventListener("click", () => doDownload(btn, API_BASE)));
}

async function doDownload(btn, API_BASE) {
  const courseId = btn.dataset.download;
  const token = localStorage.getItem("lc_token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Downloading`;

  try {
    const res = await fetch(`${API_BASE}/v1/download/${encodeURIComponent(courseId)}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    // NOTE: If backend crashes/connection resets => this fetch throws and goes to catch.
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      alert(`Download failed (HTTP ${res.status}). ${text}`);
      return;
    }

    const cd = res.headers.get("Content-Disposition") || "";
    let filename = `course_${courseId}.pdf`;
    const match = cd.match(/filename=\"?([^\";]+)\"?/i);
    if (match && match[1]) filename = match[1];

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert(`Network error: ${e.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-download"></i> Download`;
  }
}

function renderOrdersPlaceholder() {
  const tableRoot = qs("#orderTableBody");
  tableRoot.innerHTML = `
    <tr>
      <td colspan="5" class="text-muted">
        Order History will be loaded from backend later (GET /v1/orders).
      </td>
    </tr>
  `;
}

// backend returns thumbnailUrl like "/v1/thumb/15"
function buildThumbSrc(API_BASE, thumbnailUrl) {
  if (!thumbnailUrl || String(thumbnailUrl).trim().length === 0) return "";
  return `${API_BASE}${thumbnailUrl}?v=${Date.now()}`;
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

function safeJson(s) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}