export function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");

  if (!sidebar || !overlay || !openBtn || !closeBtn) {
    console.warn("Sidebar elements not found");
    return;
  }

  const open = () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  };

  const close = () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ✅ NEU: Sidebar schließen, wenn ein Nav-Link geklickt wird (nur Mobile)
  const navLinks = sidebar.querySelectorAll("a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        close();
      }
    });
  });

  // Desktop ↔ Mobile Wechsel korrekt behandeln
  const mediaQuery = window.matchMedia("(min-width: 768px)");

  const handleBreakpointChange = () => {
    if (mediaQuery.matches) {
      overlay.classList.add("hidden");
      sidebar.classList.remove("-translate-x-full");
    } else {
      sidebar.classList.add("-translate-x-full");
    }
  };

  mediaQuery.addEventListener("change", handleBreakpointChange);
  handleBreakpointChange(); // initialer Zustand
}
