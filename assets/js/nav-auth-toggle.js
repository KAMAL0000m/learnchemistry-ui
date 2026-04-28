// assets/js/nav-auth-toggle.js

let cartHandlerAttached = false; // 🔥 guard

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

      window.dispatchEvent(new Event("lc:auth-changed"));
      window.location.href = "login.html";
    };

  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;

    if (userItem) userItem.classList.add("d-none");
  }
}

//
// ✅ Attach cart handler ONLY ONCE
//
window.addEventListener("lc:navbar-loaded", () => {
  if (cartHandlerAttached) return; // 🔥 prevent duplicate

  const cartBtn = document.getElementById("navCartBtn");
  if (!cartBtn) return;

  cartBtn.addEventListener("click", (e) => {
    const user = getCurrentUser();

    if (!user) {
      e.preventDefault();

      showToast("Please login to view cart", "error");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    }
  });

  cartHandlerAttached = true;
});

//
// Run after navbar loads
//
window.addEventListener("lc:navbar-loaded", updateNavAuth);

//
// Fallback
//
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateNavAuth, 100);
});

//
// Listen for auth changes
//
window.addEventListener("lc:auth-changed", () => {
  updateNavAuth();
  setTimeout(updateNavCartCount, 50);
});