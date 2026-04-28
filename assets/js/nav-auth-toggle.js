// assets/js/nav-auth-toggle.js

function updateNavAuth() {
  const authLink = document.getElementById("navAuthLink");
  const userItem = document.getElementById("navUserItem");
  const userLabel = document.getElementById("navUserLabel");

  if (!authLink) return;

  const token = localStorage.getItem("lc_token");
  const userRaw = localStorage.getItem("lc_user");
  const isLoggedIn = !!token;

  if (isLoggedIn) {
    authLink.textContent = "Logout";
    authLink.href = "#";

    // Show username
    if (userRaw && userItem && userLabel) {
      try {
        const user = JSON.parse(userRaw);
        userLabel.textContent = `Hi, ${user.name || "User"}`;
        userItem.classList.remove("d-none");
      } catch {
        userItem.classList.add("d-none");
      }
    }

    authLink.onclick = (e) => {
      e.preventDefault();

      localStorage.removeItem("lc_token");
      localStorage.removeItem("lc_user");

      updateNavAuth(); // update instantly
      window.location.href = "login.html";
    };

  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;

    if (userItem) userItem.classList.add("d-none");
  }
}

// Run after navbar loads
window.addEventListener("lc:navbar-loaded", updateNavAuth);

// Optional: run on page load (fallback)
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateNavAuth, 100);
});

// 🔥 IMPORTANT: listen for login event
window.addEventListener("lc:auth-changed", updateNavAuth);