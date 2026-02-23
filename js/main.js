import { initFixCostPage } from "./ui/fixCost.js";
import { initIncomePage } from "./ui/income.js";
import { initSidebar } from "./ui/sidebar.js";
import { initMonthSelector } from "./ui/monthSelector.js";
import { createPageMenu } from "./ui/topBar.js";
import { updateCategoryCostsChart } from "./ui/categoryCostsChart.js";

const API = "https://monetabackend.onrender.com";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ============================
// 🔐 AUTH CHECK
// ============================
async function checkAuth() {
  try {
    const res = await fetch(`${API}/api/auth/me`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      redirectToLogin();
      throw new Error("Nicht eingeloggt");
    }

    return await res.json();
  } catch (err) {
    redirectToLogin();
    throw err;
  }
}

function redirectToLogin() {
  if (!window.location.pathname.includes("login.html")) {
    window.location.href = "login.html";
  }
}

// ============================
// Costs laden
// ============================
async function fetchCosts() {
  try {
    const res = await fetch(`${API}/api/costs`, {
      credentials: "include",
    });

    if (!res.ok) {
      console.warn("[main] Konnte costs nicht laden:", res.status);
      return [];
    }

    const json = await res.json();
    return json.costs ?? json;
  } catch (err) {
    console.error("Costs Fehler:", err);
    return [];
  }
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
    // 🔐 1. Auth prüfen
    const user = await checkAuth();

    const page = document.body.dataset.page;

    // ============================
    // UI init
    // ============================
    initSidebar();
    initMonthSelector();

    // ============================
    // PageMenu
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
    // Seitenlogik
    // ============================
    if (page === "fixcosts") initFixCostPage();
    if (page === "income") initIncomePage();
    if (page === "dashboard") initDashboardPage();

    // ============================
    // Username anzeigen
    // ============================
    const el = document.getElementById("username");
    if (el) {
      el.textContent = user.username || "User";
    }

    // ============================
    // Profile Button
    // ============================
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
      profileBtn.addEventListener("click", () => {
        window.location.href = "profile.html";
      });
    }

    // ============================
    // Notifications
    // ============================
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
