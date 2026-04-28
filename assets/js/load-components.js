// assets/js/load-components.js

document.addEventListener("DOMContentLoaded", async () => {
  const navbarRoot = document.getElementById("navbarRoot");
  if (!navbarRoot) return;

  try {
    const res = await fetch("components/navbar.html", { cache: "no-store" });
    if (!res.ok) throw new Error(`Navbar load failed: HTTP ${res.status}`);
    navbarRoot.innerHTML = await res.text();

    // ✅ Notify other scripts that navbar is ready
    window.dispatchEvent(new Event("lc:navbar-loaded"));
  } catch (err) {
    console.error(err);
    navbarRoot.innerHTML =
      `<div class="alert alert-danger m-0">Failed to load navbar.</div>`;
  }
});