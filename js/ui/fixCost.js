// =======================================
// FIXKOSTEN – FRONTEND LOGIK
// =======================================

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

const API_BASE = "https://monetabackend.onrender.com";
const COSTS_URL = `${API_BASE}/api/costs`;

// =======================================
// Initialisierung
// =======================================
export function initFixCostPage() {
  console.log("Fixkosten-Seite wird initialisiert...");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("Kein Token — Weiterleitung zum Login.");
    window.location.href = "/pages/login.html";
    return;
  }

  initEventListeners();
  loadCosts();
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

  console.log("Fixkosten Event-Listener registriert.");
}

// =======================================
// POST – Speichern
// =======================================
async function saveCost(e) {
  e.preventDefault();

  const data = {
    kosten: Number(document.getElementById("ovCost").value),
    name: document.getElementById("ovName").value.trim(),
    kategorie: document.getElementById("ovCategory").value.trim(),
    costType: document.getElementById("ovType").value,
  };

  if (isNaN(data.kosten) || data.name === "" || data.kategorie === "") {
    alert("Bitte alle Felder korrekt ausfüllen!");
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

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error("Fehler beim Speichern:", errorMsg);
      alert("Fehler beim Speichern!");
      return;
    }

    const saved = await res.json();
    addToTable(saved);
    updateSums();

    overlay.classList.add("hidden");
    form.reset();
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
  }
}

// =======================================
// GET – Laden
// =======================================
export async function loadCosts() {
  try {
    const res = await fetch(COSTS_URL, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (!res.ok) {
      console.error("Fehler beim Laden:", await res.text());
      return;
    }

    const costs = await res.json();
    costs.forEach(addToTable);
    updateSums();
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
}

// =======================================
// ZEILE EINFÜGEN
// =======================================
function addToTable(c) {
  if (!c || typeof c.kosten !== "number") {
    console.error("Ungültiger Cost-Eintrag:", c);
    return;
  }

  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="border px-2 py-1">${c.kosten.toFixed(2)} €</td>
    <td class="border px-2 py-1">${c.name}</td>
    <td class="border px-2 py-1">${c.kategorie}</td>
    <td class="border px-2 py-1 text-center">
      <button class="deleteBtn text-red-600" data-id="${c._id}">🗑️</button>
    </td>
  `;

  if (c.costType === "fix") tableFix.appendChild(row);
  else if (c.costType === "jährlich") tableYearly.appendChild(row);
  else tableVar.appendChild(row);
}

// =======================================
// DELETE – Löschen
// =======================================
async function handleDelete(e) {
  if (!e.target.classList.contains("deleteBtn")) return;

  const id = e.target.dataset.id;
  if (!id) return;

  await fetch(`${COSTS_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });

  e.target.closest("tr")?.remove();
  updateSums();
}

// =======================================
// SUMMEN
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
    const value = parseFloat(row.children[0].textContent);
    total += isNaN(value) ? 0 : value;
  });
  return total;
}
