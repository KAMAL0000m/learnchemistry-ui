
// assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const form = qs('#loginForm');
  if (!form) return;

  // Change this to your backend base URL
  const API_BASE = 'http://localhost:8080';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = qs('#authEmail').value.trim();
    const password = qs('#authPassword').value.trim();

    if (!email || !password) {
      qs('#authMsg').innerHTML = `<div class="alert alert-warning">Please enter email and password.</div>`;
      return;
    }

    qs('#authMsg').innerHTML = `<div class="alert alert-info">Logging in...</div>`;

    try {
      const res = await fetch(`${API_BASE}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      var statusCode = res.status;
      // If backend returns non-200, show error message
      if (!res.ok) {
        let msg = `Login failed (HTTP ${res.status})`;
        try {
          const errJson = await res.json();
          msg = errJson?.error || msg;
        } catch (_) {}
        qs('#authMsg').innerHTML = `<div class="alert alert-danger">${msg}</div>`;
        return;
      }

      const data = await res.json();
      const token = data.token;

      if (!token) {
        qs('#authMsg').innerHTML = `<div class="alert alert-danger">Login failed: token not received.</div>`;
        return;
      }

      // Store token + user info
      localStorage.setItem('lc_token', token);
      localStorage.setItem('lc_user', JSON.stringify({
        email,
        userId: data.userId,
        name: email.split('@')[0]
      }));

      qs('#authMsg').innerHTML = `<div class="alert alert-success">Login successful. Redirecting...</div>`;
      setTimeout(() => window.location.href = 'dashboard.html', 600);

    } catch (err) {
      qs('#authMsg').innerHTML = `<div class="alert alert-danger">Network error: ${err.message}</div>`;
    }
  });

  qs('#btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('lc_token');
    localStorage.removeItem('lc_user');
    window.location.reload();
  });
});
