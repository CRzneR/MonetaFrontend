// =======================================
// FIXKOSTEN – FRONTEND LOGIK (Option 1)
// Chart komplett ausgelagert in categoryCostsChart.js
// Keine CostsStore / CategoryChart Abhängigkeit mehr
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

// ✅ API Base dynamisch (lokal / prod)
const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://monetabackend.onrender.com";

const COSTS_URL = `${API_BASE}/api/costs`;

// =======================================
// Monat Helpers (für Abgebucht pro Monat)
// =======================================
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function monthToNumber(monthLabel) {
  const idx = MONTHS.indexOf(monthLabel);
  return idx === -1 ? null : idx + 1; // Jan=1 ... Dez=12
}

function monthKey(year, monthLabel) {
  const m = monthToNumber(monthLabel);
  if (!m || !year) return null;
  return `${year}-${String(m).padStart(2, "0")}`; // z.B. 2026-02
}

// =======================================
// GUARD: läuft nur, wenn Fixkosten-DOM vorhanden ist
// =======================================
const hasFixCostDom =
  !!(addBtn && overlay && closeOverlay && form && tableFix && tableYearly && tableVar) &&
  !!(fixSum && yearlySum && varSum && totalSum);

// Cache der zuletzt geladenen Kosten (für Chart Updates ohne extra Fetch)
let lastLoadedCosts = [];

// =======================================
// Initialisierung
// =======================================
export function initFixCostPage() {
  if (!hasFixCostDom) {
    console.warn("FixCost DOM nicht gefunden – initFixCostPage() wird übersprungen.");
    return;
  }

  console.log("Fixkosten-Seite wird initialisiert...");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("Kein Token — Weiterleitung zum Login.");
    window.location.href = "/pages/login.html";
    return;
  }

  initEventListeners();
  loadCosts();

  // ✅ Bei Monat-Wechsel neu laden
  document.addEventListener("month:changed", () => {
    loadCosts();
  });
}

// Verhindert doppelte Registrierung
let eventsInitialized = false;

function initEventListeners() {
  if (eventsInitialized) return;
  eventsInitialized = true;

  addBtn?.addEventListener("click", () => overlay.classList.remove("hidden"));
  closeOverlay?.addEventListener("click", () => overlay.classList.add("hidden"));

  form?.addEventListener("submit", saveCost);
  document.addEventListener("click", handleDelete);

  // ✅ Abgebucht pro Monat speichern
  document.addEventListener("change", handleAbgebuchtChange);

  console.log("Fixkosten Event-Listener registriert.");
}

// =======================================
// POST – Speichern
// Neu: Einträge sollen in ALLEN Monaten erscheinen -> recurring: true
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

    // ✅ in allen Monaten anzeigen
    recurring: true,

    // optional (Backend kann month bei recurring ignorieren)
    month: selectedMonth,
    year: selectedYear,
  };

  if (isNaN(data.kosten) || !data.name || !data.kategorie) {
    alert("Bitte alle Felder korrekt ausfüllen!");
    return;
  }

  if (!selectedMonth || !Number.isFinite(selectedYear)) {
    alert("Bitte zuerst einen Monat auswählen!");
    return;
  }

  try {
    const res = await fetch(COSTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(data),
    });

    if (res.status === 403) {
      console.error("Token ungültig oder abgelaufen.");
      return;
    }

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error("Fehler beim Speichern:", errorMsg);
      alert("Fehler beim Speichern!");
      return;
    }

    // ✅ Reload, damit recurring korrekt im aktuellen Monat erscheint
    await loadCosts();

    overlay.classList.add("hidden");
    form.reset();
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
  }
}

// =======================================
// GET – Laden (gefiltert nach Monat/Jahr)
// Backend liefert: (month = selected) OR (recurring = true)
// =======================================
export async function loadCosts() {
  if (!tableFix || !tableYearly || !tableVar) return;

  const month = localStorage.getItem("selectedMonth");
  const year = localStorage.getItem("selectedYear");

  const url = new URL(COSTS_URL);
  if (month) url.searchParams.set("month", month);
  if (year) url.searchParams.set("year", year);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (res.status === 403) {
      console.error("Token ungültig oder abgelaufen.");
      return;
    }

    if (!res.ok) {
      console.error("Fehler beim Laden:", await res.text());
      return;
    }

    const costs = await res.json();
    lastLoadedCosts = costs;

    tableFix.innerHTML = "";
    tableYearly.innerHTML = "";
    tableVar.innerHTML = "";

    costs.forEach(addToTable);

    // ✅ Summen nach Render aktualisieren (Abgebucht zählt als neuer Wert)
    updateSums();

    // ✅ Chart updaten (effektiv: Abgebucht zählt, wenn vorhanden)
    updateCategoryCostsChart(costs, {
      monthLabel: month,
      year,
      canvasId: "categoryChart",
    });
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
}

// =======================================
// ZEILE EINFÜGEN (inkl. Abgebucht pro Monat)
// c.abgebuchtByMonth: { "2026-02": 12.34, ... }
// =======================================
function addToTable(c) {
  if (!tableFix || !tableYearly || !tableVar) return;

  const value = Number(c?.kosten);
  if (!c || Number.isNaN(value)) {
    console.error("Ungültiger Cost-Eintrag:", c);
    return;
  }

  const selectedMonth = localStorage.getItem("selectedMonth");
  const selectedYear = localStorage.getItem("selectedYear");
  const key = monthKey(selectedYear, selectedMonth);

  const abgebuchtRaw = key && c.abgebuchtByMonth ? c.abgebuchtByMonth[key] : null;
  const abgebuchtValue =
    abgebuchtRaw === null || abgebuchtRaw === undefined || abgebuchtRaw === ""
      ? ""
      : Number(abgebuchtRaw).toFixed(2);

  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="border px-2 py-1">${value.toFixed(2)} €</td>

    <td class="border px-2 py-1">
      <input
        type="number"
        step="0.01"
        inputmode="decimal"
        class="w-28 border border-gray-300 rounded px-2 py-1 text-right"
        placeholder="0.00"
        value="${abgebuchtValue}"
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
// Effektiver Wert pro Zeile:
// Wenn Abgebucht gesetzt -> Abgebucht zählt
// sonst -> Kosten zählen
// =======================================
function getEffectiveValueForRow(row) {
  const kosten = parseFloat(row.children[0]?.textContent) || 0;

  const input = row.querySelector('input[data-field="abgebucht"]');
  const abgebucht = input && input.value !== "" ? Number(input.value) : null;

  return abgebucht !== null && Number.isFinite(abgebucht) ? abgebucht : kosten;
}

// =======================================
// PATCH – Abgebucht pro Monat speichern
// sendet: { abgebucht, month: <1-12>, year: <YYYY> }
// + UI sofort aktualisieren + Chart updaten
// =======================================
async function handleAbgebuchtChange(e) {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.dataset.field !== "abgebucht") return;

  const id = input.dataset.id;
  if (!id) return;

  const selectedMonth = localStorage.getItem("selectedMonth");
  const selectedYear = Number(localStorage.getItem("selectedYear"));
  const monthNumber = monthToNumber(selectedMonth);

  if (!monthNumber || !Number.isFinite(selectedYear)) return;

  const value = input.value === "" ? null : Number(input.value);
  if (value !== null && Number.isNaN(value)) return;

  // ✅ UI sofort aktualisieren: Abgebucht zählt nun als neuer Wert
  updateSums();

  // ✅ Chart sofort updaten (nutzt effektive Werte aus lastLoadedCosts)
  // Hinweis: lastLoadedCosts enthält abgebuchtByMonth aus dem Backend.
  // Wenn du sofort nach Eingabe auch im Chart den neuen Wert sehen willst,
  // patchen wir den Cache zusätzlich lokal:
  patchLocalAbgebuchtCache(id, selectedYear, selectedMonth, value);

  updateCategoryCostsChart(lastLoadedCosts, {
    monthLabel: selectedMonth,
    year: String(selectedYear),
    canvasId: "categoryChart",
  });

  try {
    const res = await fetch(`${COSTS_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ abgebucht: value, month: monthNumber, year: selectedYear }),
    });

    if (!res.ok) {
      console.error("Abgebucht konnte nicht gespeichert werden:", await res.text());
      return;
    }

    // Optional: Nach erfolgreichem PATCH nochmal frisch laden, falls du absolute Konsistenz willst
    // await loadCosts();
  } catch (err) {
    console.error("Abgebucht PATCH error:", err);
  }
}

// Lokales Cache Update, damit Chart ohne Reload sofort stimmt
function patchLocalAbgebuchtCache(id, year, monthLabel, value) {
  const key = monthKey(String(year), monthLabel);
  if (!key) return;

  const item = lastLoadedCosts.find((c) => c && c._id === id);
  if (!item) return;

  if (!item.abgebuchtByMonth || typeof item.abgebuchtByMonth !== "object") {
    item.abgebuchtByMonth = {};
  }

  if (value === null) {
    delete item.abgebuchtByMonth[key];
  } else {
    item.abgebuchtByMonth[key] = value;
  }
}

// =======================================
// DELETE – Löschen
// =======================================
async function handleDelete(e) {
  if (!e.target.classList.contains("deleteBtn")) return;

  const id = e.target.dataset.id;
  if (!id) return;

  try {
    const res = await fetch(`${COSTS_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (!res.ok) {
      console.error("Fehler beim Löschen:", await res.text());
      return;
    }

    e.target.closest("tr")?.remove();

    // ✅ Cache anpassen (für Chart)
    lastLoadedCosts = lastLoadedCosts.filter((c) => c && c._id !== id);

    // ✅ Summen neu berechnen (Abgebucht zählt)
    updateSums();

    // ✅ Chart neu berechnen
    updateCategoryCostsChart(lastLoadedCosts, {
      monthLabel: localStorage.getItem("selectedMonth"),
      year: localStorage.getItem("selectedYear"),
      canvasId: "categoryChart",
    });
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
  }
}

// =======================================
// SUMMEN (effektiver Wert: Abgebucht wenn gesetzt, sonst Kosten)
// =======================================
function updateSums() {
  if (!fixSum || !yearlySum || !varSum || !totalSum) return;

  fixSum.textContent = sumEffective(tableFix).toFixed(2);
  yearlySum.textContent = sumEffective(tableYearly).toFixed(2);
  varSum.textContent = sumEffective(tableVar).toFixed(2);

  totalSum.textContent = (
    Number(fixSum.textContent) +
    Number(yearlySum.textContent) +
    Number(varSum.textContent)
  ).toFixed(2);
}

function sumEffective(table) {
  if (!table) return 0;

  let total = 0;
  table.querySelectorAll("tr").forEach((row) => {
    total += getEffectiveValueForRow(row);
  });

  return total;
}
