// assets/js/admin.js
// Real Admin backend integration

document.addEventListener("DOMContentLoaded", () => {
  const form = qs("#adminAddProductForm");
  const msg = qs("#adminMsg");
  const ordersBody = qs("#adminOrdersBody");

  const API = "http://localhost:8080";
  const token = localStorage.getItem("lc_token");

  if (!token) {
    msg.innerHTML = `<div class="alert alert-danger">Admin login required.</div>`;
    setTimeout(() => window.location.href = "login.html", 600);
    return;
  }

  loadOrders();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pdf = qs("#adminPdfFile").files[0];
    const title = qs("#adminTitle").value.trim();
    const exam = qs("#adminExam").value;
    const priceInr = parseInt(qs("#adminPrice").value || "0", 10);
    const description = qs("#adminDesc").value.trim();

    if (!title || !pdf) {
      msg.innerHTML = `<div class="alert alert-warning">Title and PDF required.</div>`;
      return;
    }

    msg.innerHTML = `<div class="alert alert-info">Creating course...</div>`;

    try {
      // 1️⃣ Create course
      const cRes = await fetch(`${API}/v1/admin/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, exam, priceInr, description })
      });

      const cData = await cRes.json();
      if (!cRes.ok) throw new Error(cData.error || "Course creation failed");

      const courseId = cData.courseId;

      msg.innerHTML = `<div class="alert alert-info">Uploading PDF...</div>`;

      // 2️⃣ Upload PDF
      const pRes = await fetch(`${API}/v1/admin/course-pdf/${courseId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/pdf",
          "X-Filename": pdf.name
        },
        body: pdf
      });

      const pData = await pRes.json();
      if (!pRes.ok) throw new Error(pData.error || "PDF upload failed");

      msg.innerHTML = `
        <div class="alert alert-success">
          ✅ Course created & PDF uploaded<br/>
          <small>courseId=${courseId}</small>
        </div>
      `;

      form.reset();
      loadOrders();

    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
    }
  });

  async function loadOrders() {
    ordersBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

    try {
      const res = await fetch(`${API}/v1/admin/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");

      if (!data.items.length) {
        ordersBody.innerHTML = `<tr><td colspan="5" class="text-muted">No orders found.</td></tr>`;
        return;
      }

      ordersBody.innerHTML = data.items.map(o => `
        <tr>
          <td>${o.orderId}</td>
          <td>${o.email}</td>
          <td>${formatINR(Math.round(o.totalPaise / 100))}</td>
          <td><span class="badge text-bg-success">${o.status}</span></td>
          <td>${o.createdAt}</td>
        </tr>
      `).join("");

    } catch (err) {
      ordersBody.innerHTML = `<tr><td colspan="5" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
    }
  }
});

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}