import { initFixCostPage } from "./ui/fixCost.js";
import { initIncomePage } from "./ui/income.js";
import { initSidebar } from "./ui/sidebar.js";
import { initMonthSelector } from "./ui/monthSelector.js";
import { createPageMenu } from "./ui/topBar.js";
import { updateCategoryCostsChart } from "./ui/categoryCostsChart.js";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ============================
// 🔐 AUTH CHECK
// ============================
async function checkAuth() {
  const res = await fetch("/api/auth/me", {
    credentials: "include", // ⭐ sendet Session-Cookie
  });

  if (!res.ok) {
    window.location.href = "login.html";
    throw new Error("Nicht eingeloggt");
  }

  return await res.json(); // User-Daten
}

// ============================
// Costs laden (Session-Version)
// ============================
async function fetchCosts() {
  const res = await fetch("/api/costs", {
    credentials: "include",
  });

  if (!res.ok) {
    console.warn("[main] Konnte costs nicht laden:", res.status);
    return [];
  }

  const json = await res.json();
  return json.costs ?? json;
}

// ============================
// Dashboard
// ============================
async function initDashboardPage() {
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;

  const costs = await fetchCosts();

  const now = new Date();
  const monthLabel = MONTHS[now.getMonth()];
  const year = now.getFullYear();

  updateCategoryCostsChart(costs, {
    canvasId: "categoryChart",
    monthLabel,
    year,
  });
}

// ============================
// APP START
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🔐 1. Prüfen ob eingeloggt
    const user = await checkAuth();

    const page = document.body.dataset.page;

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

    if (page === "dashboard") {
      initDashboardPage();
    }

    // ============================
    // Username aus Server
    // ============================
    const el = document.getElementById("username");
    if (el) {
      el.textContent = user.username || "User";
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
  } catch (err) {
    console.error("Auth fehlgeschlagen:", err);
  }
});
