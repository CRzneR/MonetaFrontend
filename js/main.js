import { initFixCostPage } from "./ui/fixCost.js";
import { initIncomePage } from "./ui/income.js";
import { initSidebar } from "./ui/sidebar.js";
import { initMonthSelector } from "./ui/monthSelector.js";
import { createPageMenu } from "./ui/topBar.js";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  // Sidebar & Monatswahl immer initialisieren
  initSidebar();
  initMonthSelector();

  // ============================
  // PageMenu dynamisch einfügen
  // ============================
  const pageTitles = {
    dashboard: "Dashboard",
    income: "Einnahmen",
    fixcosts: "Fixkosten",
  };

  const title = pageTitles[page] || "Moneta";

  const main = document.querySelector("main");
  if (main) {
    const pageMenu = createPageMenu(title);
    main.prepend(pageMenu);
  }

  // ============================
  // Seiten-spezifische Logik
  // ============================
  if (page === "fixcosts") {
    initFixCostPage();
  }

  if (page === "income") {
    initIncomePage();
  }

  // ============================
  // Username setzen (zentral)
  // ============================
  const el = document.getElementById("username");
  if (el) {
    const username = localStorage.getItem("username");
    el.textContent = username || "Gast";
  }

  // ============================
  // PageMenu Events
  // ============================
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      console.log("🔔 Benachrichtigungen");
    });
  }
});
