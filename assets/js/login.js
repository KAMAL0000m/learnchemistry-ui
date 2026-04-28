// assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const form = qs('#loginForm');
  if (!form) return;

  const API_BASE = 'http://localhost:8080';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = qs('#authEmail').value.trim();
    const password = qs('#authPassword').value.trim();

    if (!email || !password) {
      qs('#authMsg').innerHTML =
        `<div class="alert alert-warning">Please enter email and password.</div>`;
      return;
    }

    qs('#authMsg').innerHTML =
      `<div class="alert alert-info">Logging in...</div>`;

    try {
      const res = await fetch(`${API_BASE}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        let msg = `Login failed (HTTP ${res.status})`;
        try {
          const errJson = await res.json();
          msg = errJson?.error || msg;
        } catch (_) {}

        qs('#authMsg').innerHTML =
          `<div class="alert alert-danger">${msg}</div>`;
        return;
      }

      const data = await res.json();
      const token = data.token;

      if (!token) {
        qs('#authMsg').innerHTML =
          `<div class="alert alert-danger">Login failed: token not received.</div>`;
        return;
      }

      // ✅ Save auth data
      localStorage.setItem('lc_token', token);
      localStorage.setItem('lc_user', JSON.stringify({
        email,
        userId: data.userId,
        name: email.split('@')[0]
      }));

      // 🔥 IMPORTANT: notify navbar immediately
      window.dispatchEvent(new Event("lc:auth-changed"));

      qs('#authMsg').innerHTML =
        `<div class="alert alert-success">Login successful. Redirecting...</div>`;

      // slight delay so UI updates before redirect
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 300);

    } catch (err) {
      qs('#authMsg').innerHTML =
        `<div class="alert alert-danger">Network error: ${err.message}</div>`;
    }
  });

  // Optional logout button (if exists on page)
  qs('#btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('lc_token');
    localStorage.removeItem('lc_user');

    // 🔥 notify navbar
    window.dispatchEvent(new Event("lc:auth-changed"));

    window.location.reload();
  });
});