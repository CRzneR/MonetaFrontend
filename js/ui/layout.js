// ../js/ui/layout.js

document.addEventListener("DOMContentLoaded", () => {
  const API = "https://monetabackend.onrender.com";

  // =======================
  // Sidebar laden
  // =======================

  fetch("/pages/sidebar.html", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`sidebar.html konnte nicht geladen werden: ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const sidebarMount = document.getElementById("sidebar");
      if (!sidebarMount) return;

      sidebarMount.innerHTML = html;
      sidebarMount.classList.add("h-screen");

      if (isMobile()) {
        sidebarMount.classList.add("-translate-x-full");
      }
    })
    .catch((err) => console.error(err));

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  let mobileOverlayEl = null;

  const lockScroll = (lock) => {
    document.body.classList.toggle("overflow-hidden", lock);
  };

  const setA11y = (open) => {
    const openBtn = document.getElementById("openSidebar");
    if (openBtn) openBtn.setAttribute("aria-expanded", String(open));
  };

  const closeMobileOverlay = () => {
    if (!mobileOverlayEl) return;
    mobileOverlayEl.remove();
    mobileOverlayEl = null;
    lockScroll(false);
    setA11y(false);
  };

  const buildMobileOverlay = () => {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return null;

    const nav = sidebar.querySelector("nav");
    const navClone = nav ? nav.cloneNode(true) : document.createElement("nav");

    const wrapper = document.createElement("div");
    wrapper.id = "mobileSidebarOverlay";
    wrapper.className = "fixed inset-0 z-50 md:hidden";

    const backdrop = document.createElement("div");
    backdrop.className = "absolute inset-0 bg-black/50";
    backdrop.dataset.close = "true";

    const panel = document.createElement("div");
    panel.className =
      "absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-2xl flex flex-col";

    panel.innerHTML = `
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="text-2xl font-bold">🧭 Moneta</div>
        <button type="button" class="p-2 rounded-lg hover:bg-gray-100"
                data-close="true" aria-label="Menü schließen">✕</button>
      </div>
    `;

    navClone.classList.add("mt-4");
    panel.appendChild(navClone);

    wrapper.appendChild(backdrop);
    wrapper.appendChild(panel);

    wrapper.addEventListener("click", (e) => {
      if (e.target.closest('[data-close="true"]')) closeMobileOverlay();
    });

    navClone.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileOverlay);
    });

    return wrapper;
  };

  const openMobileOverlay = () => {
    if (!isMobile() || mobileOverlayEl) return;

    const sidebar = document.getElementById("sidebar");
    if (!sidebar || !sidebar.querySelector("nav")) {
      console.warn("Sidebar nav not ready yet");
      return;
    }

    mobileOverlayEl = buildMobileOverlay();
    if (!mobileOverlayEl) return;

    document.body.appendChild(mobileOverlayEl);
    lockScroll(true);
    setA11y(true);
  };

  // =======================
  // Event Delegation
  // =======================

  document.addEventListener("click", async (e) => {
    const t = e.target;

    // Burger öffnen
    if (t.closest("#openSidebar")) {
      openMobileOverlay();
      return;
    }

    // 🔥 RICHTIGER Logout (Session-basiert!)
    if (t.closest("#logoutBtn") || t.closest("#mobileLogoutBtn")) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: "POST",
          credentials: "include", // ⭐ extrem wichtig
        });
      } catch (err) {
        console.warn("Logout-Request fehlgeschlagen", err);
      }

      // Danach zur Login-Seite
      window.location.href = "login.html";
      return;
    }
  });

  // ESC schließt Overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileOverlay();
  });

  // Breakpoint-Wechsel → Overlay schließen
  window.matchMedia("(min-width: 768px)").addEventListener("change", (mq) => {
    if (mq.matches) {
      closeMobileOverlay();
      lockScroll(false);
      setA11y(false);
    }
  });
});
