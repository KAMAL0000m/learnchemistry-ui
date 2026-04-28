// assets/js/nav-auth-toggle.js

function updateNavAuth() {
  const authLink = document.getElementById("navAuthLink");
  if (!authLink) return; // navbar not yet available

  const token = localStorage.getItem("lc_token");
  const userRaw = localStorage.getItem("lc_user");
  const isLoggedIn = !!token;

  const userItem = document.getElementById("navUserItem");
  const userLabel = document.getElementById("navUserLabel");

  if (isLoggedIn) {
    // ✅ Logout state
    authLink.textContent = "Logout";
    authLink.href = "#";

    // Use onclick to avoid multiple listeners if update runs multiple times
    authLink.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("lc_token");
      localStorage.removeItem("lc_user");
      window.location.href = "login.html";
    };

    // Optional: show user label if present
    if (userItem && userLabel && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const label = user.name || user.email || "";
        if (label) {
          userLabel.textContent = `Hi, ${label}`;
          userItem.classList.remove("d-none");
        } else {
          userItem.classList.add("d-none");
        }
      } catch (_) {
        userItem.classList.add("d-none");
      }
    }
  } else {
    // ✅ Login state
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;

    if (userItem) userItem.classList.add("d-none");
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", updateNavAuth);

// Run after navbar is injected
window.addEventListener("lc:navbar-loaded", updateNavAuth);

// Optional: update if another tab logs in/out
window.addEventListener("storage", (e) => {
  if (e.key === "lc_token" || e.key === "lc_user") updateNavAuth();
});