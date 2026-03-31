// ../js/ui/layout.js

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar laden (mit Fehlerbehandlung)
  fetch("sidebar.html", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`sidebar.html konnte nicht geladen werden: ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const sidebarMount = document.getElementById("sidebar");
      if (!sidebarMount) return;

      sidebarMount.innerHTML = html;
      sidebarMount.classList.add("h-screen");

      //  Optional: Mobile-Initialzustand erzwingen
      if (isMobile()) {
        sidebarMount.classList.add("-translate-x-full");
        const overlay = document.getElementById("sidebarOverlay");
        if (overlay) overlay.classList.add("hidden");
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

    //  NAV aus Sidebar klonen (inkl. Icons, Klassen, Hover)
    const nav = sidebar.querySelector("nav");
    const navClone = nav ? nav.cloneNode(true) : document.createElement("nav");

    const wrapper = document.createElement("div");
    wrapper.id = "mobileSidebarOverlay";
    wrapper.className = "fixed inset-0 z-50 md:hidden";

    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "absolute inset-0 bg-black/50";
    backdrop.dataset.close = "true";
    backdrop.setAttribute("aria-hidden", "true");

    // Panel
    const panel = document.createElement("div");
    panel.className =
      "absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-2xl flex flex-col";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Menü");

    // Header
    panel.innerHTML = `
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="text-2xl font-bold">Moneta</div>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100"
          data-close="true"
          aria-label="Menü schließen"
        >
          ✕
        </button>
      </div>
    `;

    // NAV einfügen
    navClone.classList.add("mt-4");
    panel.appendChild(navClone);

    wrapper.appendChild(backdrop);
    wrapper.appendChild(panel);

    // Schließen bei Klick auf Backdrop oder X
    wrapper.addEventListener("click", (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-close="true"]')) {
        closeMobileOverlay();
      }
    });

    //  Link-Klick schließt Overlay
    navClone.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileOverlay);
    });

    return wrapper;
  };

  const openMobileOverlay = () => {
    if (!isMobile()) return;
    if (mobileOverlayEl) return;

    // Sidebar muss geladen sein, sonst gibt es nichts zu klonen
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

  //  Event Delegation: funktioniert auch mit per-fetch eingefügtem HTML
  document.addEventListener("click", (e) => {
    const t = e.target;

    // Burger öffnen
    if (t && t.closest && t.closest("#openSidebar")) {
      openMobileOverlay();
      return;
    }

    if (t && t.closest && t.closest("#logoutBtn")) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    if (t && t.closest && t.closest("#mobileLogoutBtn")) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }
  });

  // ESC schließt Overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileOverlay();
  });

  window.matchMedia("(min-width: 768px)").addEventListener("change", (mq) => {
    if (mq.matches) {
      closeMobileOverlay();
      lockScroll(false);
      setA11y(false);
    }
  });
});
