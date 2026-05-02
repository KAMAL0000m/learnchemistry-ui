// assets/js/dashboard.js
// Fetches purchased courses from backend: GET /v1/me/courses (JWT protected)

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('lc_user') || 'null');
  qs('#userEmail').textContent = user?.email || 'guest@learnchemistry.in';

  const token = localStorage.getItem('lc_token');
  if (!token) {
    // Not logged in -> go to login
    window.location.href = 'login.html';
    return;
  }

  // Show message after checkout redirect
  if (getQueryParam('paid') === '1') {
    const orderId = getQueryParam('orderId');
    qs('#dashMsg').innerHTML =
      `<div class="alert alert-success">
        Purchase successful. Your notes are ready.
        ${orderId ? `<div class="small mt-1 text-muted">Order ID: ${escapeHtml(orderId)}</div>` : ``}
      </div>`;
  } else {
    qs('#dashMsg').innerHTML = '';
  }

  // Load purchases from backend
  await loadMyPurchasedCourses(token);

  // Orders tab (backend endpoint not implemented yet)
  renderOrdersPlaceholder();
});

async function loadMyPurchasedCourses(token) {
  const notesRoot = qs('#myNotes');
  const API_BASE = (window.LC_API_BASE || 'http://localhost:8080');

  notesRoot.innerHTML = `<div class="alert alert-info">Loading your purchases...</div>`;

  try {
    const res = await fetch(`${API_BASE}/v1/me/courses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.error || `Failed to load purchases (HTTP ${res.status})`;

      notesRoot.innerHTML = `<div class="alert alert-danger">${escapeHtml(msg)}</div>`;

      // Token invalid/expired -> login again
      if (res.status === 401) {
        setTimeout(() => window.location.href = 'login.html', 700);
      }
      return;
    }

    const items = data.items || [];
    if (!items.length) {
      notesRoot.innerHTML =
        `<div class="alert alert-info">
          No purchases yet. shop.htmlBrowse notes</a>.
        </div>`;
      return;
    }

    // Render cards
    notesRoot.innerHTML = items.map(c => {
      const title = c.title || '';
      const desc = c.description || '';
      const priceInr = Math.round((c.pricePaise || 0) / 100);
      const enrolledAt = c.enrolledAt || '';

      return `
        <div class="card note-card mb-3">
          <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">
            <img src="assets/images/note-cover.svg" class="rounded"
                 style="width:92px;height:92px;object-fit:cover" alt="cover" />
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between gap-2">
                <div>
                  <h5 class="mb-1">${escapeHtml(title)}</h5>
                  <div class="text-muted small">
                    Price: ${escapeHtml(formatINR(priceInr))}${enrolledAt ? ` • Enrolled: ${escapeHtml(enrolledAt)}` : ``}
                  </div>
                </div>
                <span class="badge text-bg-success align-self-start">Purchased</span>
              </div>
              <div class="text-muted small mt-1">${escapeHtml(desc.slice(0, 140))}${desc.length > 140 ? '...' : ''}</div>
              <div class="text-muted small mt-2">Download mapping later: <code>GET /v1/download/${escapeHtml(String(c.id))}</code></div>
            </div>
            <button class="btn btn-success" data-download="${escapeHtml(String(c.id))}">
              <i class="bi bi-download"></i> Download
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Download button (placeholder)
    qsa('[data-download]').forEach(btn => btn.addEventListener('click', async () => {
      const courseId = btn.dataset.download;
      const token = localStorage.getItem('lc_token');
      const API_BASE = (window.LC_API_BASE || 'http://localhost:8080');

      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Downloading`;

      try {
        const res = await fetch(`${API_BASE}/v1/download/${encodeURIComponent(courseId)}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          alert(`Download failed (HTTP ${res.status}). ${text}`);
          btn.disabled = false;
          btn.innerHTML = `<i class="bi bi-download"></i> Download`;
          return;
        }

        // get filename from Content-Disposition if present
        const cd = res.headers.get('Content-Disposition') || '';
        let filename = `course_${courseId}.pdf`;
        const match = cd.match(/filename=\"?([^\";]+)\"?/i);
        if (match && match[1]) filename = match[1];

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
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
    }));

  } catch (err) {
    console.error(err);
    notesRoot.innerHTML = `<div class="alert alert-danger">Network error: ${escapeHtml(err.message)}</div>`;
  }
}

function renderOrdersPlaceholder() {
  const tableRoot = qs('#orderTableBody');
  tableRoot.innerHTML =
    `<tr>
      <td colspan="5" class="text-muted">
        Order History will be loaded from backend later (GET /v1/orders).
      </td>
    </tr>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}
