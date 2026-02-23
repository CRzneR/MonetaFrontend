// =======================================
// FIXKOSTEN – FRONTEND LOGIK (Session Auth)
// =======================================
import { updateCategoryCostsChart } from "./categoryCostsChart.js";

// DOM Elemente
const addBtn = document.querySelector(".addFixCostBtn");
const overlay = document.getElementById("fixCostOverlay");
const closeOverlay = document.getElementById("closeOverlay");
const form = document.getElementById("overlayFixCostForm");

// Tabellen
const tableFix = document.querySelector("#fixKostenTabelle tbody");
const tableYearly = document.querySelector("#jaehrlicheKostenTabelle tbody");
const tableVar = document.querySelector("#variableKostenTabelle tbody");

// Summen Felder
const fixSum = document.querySelector(".fixKostenSumme");
const yearlySum = document.querySelector(".jaehrlicheKostenSumme");
const varSum = document.querySelector(".variableKostenSumme");
const totalSum = document.querySelector(".gesamtSumme");

// ⭐ API läuft auf gleicher Origin
const COSTS_URL = "/api/costs";

// =======================================
// Monat Helpers
// =======================================
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function monthToNumber(monthLabel) {
  const idx = MONTHS.indexOf(monthLabel);
  return idx === -1 ? null : idx + 1;
}

function monthKey(year, monthLabel) {
  const m = monthToNumber(monthLabel);
  if (!m || !year) return null;
  return `${year}-${String(m).padStart(2, "0")}`;
}

// =======================================
// DOM Guard
// =======================================
const hasFixCostDom =
  !!(addBtn && overlay && closeOverlay && form && tableFix && tableYearly && tableVar) &&
  !!(fixSum && yearlySum && varSum && totalSum);

let lastLoadedCosts = [];

// =======================================
// 🔐 Session-Login prüfen
// =======================================
async function ensureLoggedIn() {
  const res = await fetch("https://monetabackend.onrender.com/api/auth/me", {
    credentials: "include",
  });

  if (!res.ok) {
    window.location.href = "/pages/login.html";
    return false;
  }

  return true;
}

// =======================================
// Initialisierung
// =======================================
export async function initFixCostPage() {
  if (!hasFixCostDom) {
    console.warn("FixCost DOM nicht gefunden.");
    return;
  }

  const ok = await ensureLoggedIn();
  if (!ok) return;

  initEventListeners();
  loadCosts();

  document.addEventListener("month:changed", loadCosts);
}

// =======================================
// Event-Listener
// =======================================
let eventsInitialized = false;

function initEventListeners() {
  if (eventsInitialized) return;
  eventsInitialized = true;

  addBtn?.addEventListener("click", () => overlay.classList.remove("hidden"));
  closeOverlay?.addEventListener("click", () => overlay.classList.add("hidden"));

  form?.addEventListener("submit", saveCost);
  document.addEventListener("click", handleDelete);
  document.addEventListener("change", handleAbgebuchtChange);
}

// =======================================
// POST – Speichern
// =======================================
async function saveCost(e) {
  e.preventDefault();

  const selectedMonth = localStorage.getItem("selectedMonth");
  const selectedYear = Number(localStorage.getItem("selectedYear"));

  const data = {
    kosten: Number(document.getElementById("ovCost")?.value),
    name: document.getElementById("ovName")?.value.trim(),
    kategorie: document.getElementById("ovCategory")?.value.trim(),
    costType: document.getElementById("ovType")?.value,
    recurring: true,
    month: selectedMonth,
    year: selectedYear,
  };

  const res = await fetch(COSTS_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    alert("Fehler beim Speichern");
    return;
  }

  await loadCosts();
  overlay.classList.add("hidden");
  form.reset();
}

// =======================================
// GET – Laden
// =======================================
export async function loadCosts() {
  const month = localStorage.getItem("selectedMonth");
  const year = localStorage.getItem("selectedYear");

  const url = new URL(COSTS_URL, window.location.origin);
  if (month) url.searchParams.set("month", month);
  if (year) url.searchParams.set("year", year);

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) return;

  const costs = await res.json();
  lastLoadedCosts = costs;

  tableFix.innerHTML = "";
  tableYearly.innerHTML = "";
  tableVar.innerHTML = "";

  costs.forEach(addToTable);
  updateSums();

  updateCategoryCostsChart(costs, {
    monthLabel: month,
    year,
    canvasId: "categoryChart",
  });
}

// =======================================
// Tabelle
// =======================================
function addToTable(c) {
  const value = Number(c.kosten);
  const selectedMonth = localStorage.getItem("selectedMonth");
  const selectedYear = localStorage.getItem("selectedYear");
  const key = monthKey(selectedYear, selectedMonth);

  const abgebucht = c.abgebuchtByMonth?.[key] ?? "";

  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="border px-2 py-1">${value.toFixed(2)} €</td>
    <td class="border px-2 py-1">
      <input type="number" step="0.01"
        class="w-28 border rounded px-2 py-1 text-right"
        value="${abgebucht}"
        data-id="${c._id}"
        data-field="abgebucht"
      />
    </td>
    <td class="border px-2 py-1">${c.name ?? ""}</td>
    <td class="border px-2 py-1">${c.kategorie ?? ""}</td>
    <td class="border px-2 py-1 text-center">
      <button class="deleteBtn text-red-600" data-id="${c._id}">🗑️</button>
    </td>
  `;

  if (c.costType === "fix") tableFix.appendChild(row);
  else if (c.costType === "jährlich") tableYearly.appendChild(row);
  else tableVar.appendChild(row);
}

// =======================================
// PATCH Abgebucht
// =======================================
async function handleAbgebuchtChange(e) {
  const input = e.target;
  if (input.dataset.field !== "abgebucht") return;

  const id = input.dataset.id;
  const value = input.value === "" ? null : Number(input.value);

  const selectedMonth = localStorage.getItem("selectedMonth");
  const selectedYear = Number(localStorage.getItem("selectedYear"));

  await fetch(`${COSTS_URL}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      abgebucht: value,
      month: monthToNumber(selectedMonth),
      year: selectedYear,
    }),
  });

  updateSums();
}

// =======================================
// DELETE
// =======================================
async function handleDelete(e) {
  if (!e.target.classList.contains("deleteBtn")) return;

  const id = e.target.dataset.id;

  await fetch(`${COSTS_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  e.target.closest("tr")?.remove();
  updateSums();
}

// =======================================
// Summen
// =======================================
function updateSums() {
  fixSum.textContent = sum(tableFix).toFixed(2);
  yearlySum.textContent = sum(tableYearly).toFixed(2);
  varSum.textContent = sum(tableVar).toFixed(2);

  totalSum.textContent = (
    Number(fixSum.textContent) +
    Number(yearlySum.textContent) +
    Number(varSum.textContent)
  ).toFixed(2);
}

function sum(table) {
  let total = 0;
  table.querySelectorAll("tr").forEach((row) => {
    total += parseFloat(row.children[0]?.textContent) || 0;
  });
  return total;
}
