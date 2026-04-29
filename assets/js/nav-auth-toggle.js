// assets/js/nav-auth-toggle.js
// ✅ Single, consolidated version (no duplicate functions)

let cartHandlerAttached = false; // guard to avoid duplicate handlers

function getRoleFromToken(token) {
  // token format: uid:role:exp.signatureHex
  if (!token) return null;
  const dot = token.indexOf(".");
  const payload = dot >= 0 ? token.substring(0, dot) : token;
  const parts = payload.split(":");
  if (parts.length < 3) return null;
  return parts[1]; // role
}

function updateNavAuth() {
  const authLink  = document.getElementById("navAuthLink");
  const adminLink = document.getElementById("navAdminLink");
  const userItem  = document.getElementById("navUserItem");
  const userLabel = document.getElementById("navUserLabel");

  // If navbar not loaded yet, exit
  if (!authLink) return;

  const token = localStorage.getItem("lc_token");
  const userRaw = localStorage.getItem("lc_user");
  const isLoggedIn = !!token;

  // ✅ Admin link visibility (UI gating only; backend still enforces)
  if (adminLink) {
    const role = getRoleFromToken(token);
    if (role === "ADMIN") adminLink.classList.remove("d-none");
    else adminLink.classList.add("d-none");
  }

  if (isLoggedIn) {
    // ✅ Logout state
    authLink.textContent = "Logout";
    authLink.href = "#";

    // ✅ Show username beside logout
    if (userItem && userLabel) {
      let label = "User";
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          label = u.name || u.email || "User";
        } catch (_) {}
      }
      userLabel.textContent = `Hi, ${label}`;
      userItem.classList.remove("d-none");
    }

    authLink.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("lc_token");
      localStorage.removeItem("lc_user");

      // Let other listeners refresh UI state
      window.dispatchEvent(new Event("lc:auth-changed"));

      window.location.href = "login.html";
    };
  } else {
    // ✅ Login state
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;

    if (userItem) userItem.classList.add("d-none");
    // if logged out, also hide admin link
    if (adminLink) adminLink.classList.add("d-none");
  }
}

// ✅ Attach cart handler ONLY ONCE after navbar loads
function attachNavCartGuard() {
  if (cartHandlerAttached) return;

  const cartBtn = document.getElementById("navCartBtn");
  if (!cartBtn) return;

  cartBtn.addEventListener("click", (e) => {
    const user = getCurrentUser?.();
    if (!user) {
      e.preventDefault();
      showToast?.("Please login to view cart", "error");
      setTimeout(() => window.location.href = "login.html", 800);
    }
  });

  cartHandlerAttached = true;
}

// ✅ When navbar HTML is injected, update everything
window.addEventListener("lc:navbar-loaded", () => {
  attachNavCartGuard();
  updateNavAuth();
});

// ✅ Fallback: in case navbar is already in DOM (static include)
document.addEventListener("DOMContentLoaded", () => {
  // short delay because your navbar is injected by main.js via fetch
  setTimeout(() => {
    attachNavCartGuard();
    updateNavAuth();
  }, 100);
});

// ✅ When auth changes (logout/login), update UI + cart count
window.addEventListener("lc:auth-changed", () => {
  updateNavAuth();
  if (typeof updateNavCartCount === "function") {
    setTimeout(updateNavCartCount, 50);
  }
});
