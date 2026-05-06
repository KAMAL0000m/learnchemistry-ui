// assets/js/admin.js
// Real Admin backend integration: create course + upload PDF + upload thumbnail + list orders

document.addEventListener("DOMContentLoaded", () => {
  const form = qs("#adminAddProductForm");
  const msg = qs("#adminMsg");
  const ordersBody = qs("#adminOrdersBody");
  const btnSubmit = qs("#btnAdminSubmit");

  const API = window.LC_API_BASE || "http://localhost:8080";
  const token = localStorage.getItem("lc_token");

  if (!token) {
    msg.innerHTML = `<div class="alert alert-danger">Admin login required.</div>`;
    setTimeout(() => window.location.href = "login.html", 600);
    return;
  }

  loadOrders();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pdf = qs("#adminPdfFile")?.files?.[0];
    const thumb = qs("#adminThumbFile")?.files?.[0];

    const title = qs("#adminTitle").value.trim();
    const exam = qs("#adminExam").value;
    const priceInr = parseInt(qs("#adminPrice").value || "0", 10);
    const description = qs("#adminDesc").value.trim();

    if (!title) {
      msg.innerHTML = `<div class="alert alert-warning">Title is required.</div>`;
      return;
    }
    if (!pdf) {
      msg.innerHTML = `<div class="alert alert-warning">PDF is required.</div>`;
      return;
    }
    if (!thumb) {
      msg.innerHTML = `<div class="alert alert-warning">Thumbnail image is required.</div>`;
      return;
    }

    if (thumb.type && !thumb.type.startsWith("image/")) {
      msg.innerHTML = `<div class="alert alert-warning">Thumbnail must be an image file.</div>`;
      return;
    }

    setBusy(true);
    msg.innerHTML = `<div class="alert alert-info">Creating course...</div>`;

    try {
      // 1) Create course
      const cRes = await fetch(`${API}/v1/admin/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, exam, priceInr, description })
      });

      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) throw new Error(cData.error || `Course creation failed (HTTP ${cRes.status})`);

      const courseId = cData.courseId;
      if (!courseId) throw new Error("courseId missing from createCourse response");

      // 2) Upload PDF
      msg.innerHTML = `<div class="alert alert-info">Uploading PDF...</div>`;
      const pRes = await fetch(`${API}/v1/admin/course-pdf/${courseId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/pdf",
          "X-Filename": pdf.name
        },
        body: pdf
      });

      const pData = await pRes.json().catch(() => ({}));
      if (!pRes.ok) throw new Error(pData.error || `PDF upload failed (HTTP ${pRes.status})`);

      // 3) Upload Thumbnail
      msg.innerHTML = `<div class="alert alert-info">Uploading thumbnail...</div>`;
      const tRes = await fetch(`${API}/v1/admin/course-thumb/${courseId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": thumb.type || "image/jpeg",
          "X-Filename": thumb.name
        },
        body: thumb
      });

      const tData = await tRes.json().catch(() => ({}));
      if (!tRes.ok) throw new Error(tData.error || `Thumbnail upload failed (HTTP ${tRes.status})`);

      msg.innerHTML = `
        <div class="alert alert-success">
          ✅ Course created and files uploaded successfully.<br/>
          <small>courseId=${escapeHtml(String(courseId))}</small><br/>
          <small>thumbUrl=${escapeHtml(String(tData.thumbUrl || ""))}</small>
        </div>
      `;

      form.reset();
      loadOrders();
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
    } finally {
      setBusy(false);
    }
  });

  async function loadOrders() {
    ordersBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

    try {
      const res = await fetch(`${API}/v1/admin/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to load orders (HTTP ${res.status})`);

      const items = data.items || [];
      if (!items.length) {
        ordersBody.innerHTML = `<tr><td colspan="5" class="text-muted">No orders found.</td></tr>`;
        return;
      }

      ordersBody.innerHTML = items.map(o => `
        <tr>
          <td>${escapeHtml(String(o.orderId))}</td>
          <td>${escapeHtml(o.email || "-")}</td>
          <td>${escapeHtml(formatINR(Math.round((o.totalPaise || 0) / 100)))}</td>
          <td><span class="badge text-bg-success">${escapeHtml(o.status || "PAID")}</span></td>
          <td>${escapeHtml(o.createdAt || "-")}</td>
        </tr>
      `).join("");
    } catch (err) {
      ordersBody.innerHTML = `<tr><td colspan="5" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function setBusy(busy) {
    if (btnSubmit) btnSubmit.disabled = !!busy;
    if (btnSubmit) btnSubmit.innerHTML = busy
      ? `<span class="spinner-border spinner-border-sm me-2"></span>Working...`
      : `<i class="bi bi-cloud-upload"></i> Create Course + Upload PDF + Thumbnail`;
  }
});

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}