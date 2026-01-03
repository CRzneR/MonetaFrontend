// =======================================
// EINNAHMEN – FRONTEND LOGIK
// =======================================

// API-Basis korrekt bestimmen
const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5001" // lokal
    : "https://monetabackend.onrender.com"; // Produktion

const INCOME_URL = `${API_BASE}/api/income`;

let earningsChart = null;

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// =======================================
// EXPORTIERTE INIT-FUNKTION
// =======================================
export function initIncomePage() {
  // Zugriff nur mit Login
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  console.log("📄 Einnahmen-Seite wird initialisiert...");

  // DOM-Elemente
  const addIncomeBtn = document.getElementById("addIncomeBtn");
  const incomeOverlay = document.getElementById("incomeOverlay");
  const cancelIncomeBtn = document.getElementById("cancelIncomeBtn");
  const saveIncomeBtn = document.getElementById("saveIncomeBtn");

  // Events
  addIncomeBtn.addEventListener("click", () => {
    incomeOverlay.classList.remove("hidden");
  });

  cancelIncomeBtn.addEventListener("click", () => {
    incomeOverlay.classList.add("hidden");
  });

  saveIncomeBtn.addEventListener("click", saveIncome);

  // Globaler Delete-Listener
  document.addEventListener("click", handleDelete);

  // Daten laden
  loadIncome();
}

// =======================================
// Einnahme speichern (POST)
// =======================================
async function saveIncome() {
  const source = document.getElementById("incomeSource").value.trim();
  const amount = Number(document.getElementById("incomeAmount").value);
  const month = document.getElementById("incomeMonth").value;
  const category = document.getElementById("incomeCategory").value;

  if (!source || !amount || !month || !category) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  const newIncome = { source, amount, month, category };

  try {
    const res = await fetch(INCOME_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(newIncome),
    });

    if (!res.ok) {
      alert("❌ Fehler beim Speichern der Einnahme!");
      return;
    }

    // UI komplett aktualisieren (inkl. Chart + Stats)
    await refreshIncomeUI();

    document.getElementById("incomeOverlay").classList.add("hidden");
    document.getElementById("incomeForm").reset();
  } catch (err) {
    console.error("Income POST error:", err);
    alert("🚫 Server nicht erreichbar.");
  }
}

// =======================================
// Einnahmen laden (GET)
// =======================================
async function loadIncome() {
  try {
    await refreshIncomeUI();
  } catch (err) {
    console.error("Load income error:", err);
  }
}

// =======================================
// UI komplett neu rendern (Boxen + Chart + Stats)
// =======================================
async function refreshIncomeUI() {
  const res = await fetch(INCOME_URL, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });

  const incomes = await res.json();

  renderIncomeBoxes(incomes);
  renderChart(incomes);

  // Stats in Divs
  displayMonthlyAverage(incomes); // -> div#arvgIncome
  displaySideIncomeMoM(incomes); // -> div#sideIncomeMoM
}

// =======================================
// Einnahme-Boxen komplett rendern (Container leeren, dann neu)
// =======================================
function renderIncomeBoxes(incomes) {
  const container = document.getElementById("incomeContainer");
  if (!container) return;

  container.innerHTML = "";
  incomes.forEach(addIncomeBox);
}

// =======================================
// Einzelne Einnahme-Box in die UI einfügen
// =======================================
function addIncomeBox(inc) {
  const container = document.getElementById("incomeContainer");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "relative min-w-[200px] bg-white border border-gray-300 rounded-xl p-4 shadow";

  div.innerHTML = `
    <button 
      class="deleteIncomeBtn absolute top-2 right-2 text-red-600 hover:text-red-800"
      data-id="${inc._id}">
        🗑️
    </button>

    <p class="text-gray-400">${inc.source}</p>
    <p class="text-lg font-bold">${Number(inc.amount).toFixed(2)} €</p>
    <p class="text-sm text-gray-500">${inc.month} – ${inc.category}</p>
  `;

  container.appendChild(div);
}

// =======================================
// DELETE – Einnahme löschen
// =======================================
async function handleDelete(e) {
  if (!e.target.classList.contains("deleteIncomeBtn")) return;

  const id = e.target.dataset.id;

  if (!confirm("Diese Einnahme wirklich löschen?")) return;

  try {
    const res = await fetch(`${INCOME_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!res.ok) {
      alert("Fehler beim Löschen!");
      return;
    }

    // UI komplett aktualisieren (inkl. Chart + Stats)
    await refreshIncomeUI();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Serverfehler beim Löschen!");
  }
}

// =======================================
// 🧮 Monatsdurchschnitt berechnen (Summe / Anzahl Monate mit Einträgen)
// =======================================
function calculateMonthlyAverage(incomes) {
  if (!incomes.length) return 0;

  const monthsWithData = new Set();
  let totalSum = 0;

  incomes.forEach((inc) => {
    totalSum += Number(inc.amount) || 0;
    if (inc.month) monthsWithData.add(inc.month);
  });

  const monthCount = monthsWithData.size || 1;
  return totalSum / monthCount;
}

// =======================================
// Monatsdurchschnitt anzeigen -> div#arvgIncome
// =======================================
function displayMonthlyAverage(incomes) {
  const container = document.getElementById("arvgIncome");
  if (!container) return;

  const avg = calculateMonthlyAverage(incomes);

  // Reset
  container.innerHTML = "";

  // --- Zeile 1: Label ---
  const label = document.createElement("div");
  label.className = "text-sm text-gray-500";
  label.textContent = "Ø Einnahmen pro Monat";

  // --- Zeile 2: Wert ---
  const value = document.createElement("div");
  value.className = "text-2xl font-bold text-gray-900";
  value.textContent = `${avg.toFixed(2)} €`;

  container.appendChild(label);
  container.appendChild(value);
}

// =======================================
// Nebeneinkünfte pro Monat aufsummieren
// =======================================
function getSideTotalsByMonth(incomes) {
  const totals = {};
  MONTHS.forEach((m) => (totals[m] = 0));

  incomes.forEach((inc) => {
    if (inc.category === "Nebeneinkünfte" && totals.hasOwnProperty(inc.month)) {
      totals[inc.month] += Number(inc.amount) || 0;
    }
  });

  return totals;
}

// =======================================
// 📈 Nebeneinkünfte %-Änderung zum Vormonat -> div#sideIncomeMoM
// =======================================
function displaySideIncomeMoM(incomes) {
  const container = document.getElementById("sideIncomeMoM");
  if (!container) return;

  const sideTotals = getSideTotalsByMonth(incomes);

  const lastIdx = [...MONTHS.keys()].filter((idx) => sideTotals[MONTHS[idx]] > 0).pop();

  if (lastIdx === undefined) {
    container.textContent = "Nebeneinkünfte: keine Daten vorhanden.";
    return;
  }

  const currMonth = MONTHS[lastIdx];
  const prevMonth = MONTHS[(lastIdx + 11) % 12];

  const curr = sideTotals[currMonth];
  const prev = sideTotals[prevMonth];

  // Reset
  container.innerHTML = "";

  // --- Zeile 1: Beschreibung ---
  const label = document.createElement("div");
  label.className = "text-sm text-gray-500";
  label.textContent = `Nebeneinkünfte ${prevMonth} → ${currMonth}`;
  container.appendChild(label);

  // --- Zeile 2: Prozentwert ---
  const value = document.createElement("div");
  value.className = "text-2xl font-bold";

  if (prev === 0) {
    value.classList.add("text-gray-400");
    value.textContent = "–";
    container.appendChild(value);
    return;
  }

  const pct = ((curr - prev) / prev) * 100;
  const sign = pct > 0 ? "+" : "";
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "▬";

  value.classList.add(pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-gray-500");

  value.textContent = `${arrow} ${sign}${pct.toFixed(1)}%`;

  container.appendChild(value);
}

// =======================================
// Chart erstellen
// =======================================
function renderChart(incomes) {
  const salaryTotals = {};
  const sideTotals = {};

  // Startwerte auf 0 setzen
  MONTHS.forEach((m) => {
    salaryTotals[m] = 0;
    sideTotals[m] = 0;
  });

  // Einnahmen sortieren
  incomes.forEach((i) => {
    if (i.category === "Gehalt") {
      salaryTotals[i.month] += Number(i.amount) || 0;
    } else if (i.category === "Nebeneinkünfte") {
      sideTotals[i.month] += Number(i.amount) || 0;
    }
  });

  const ctx = document.getElementById("earningsChart");
  if (!ctx) return;

  if (earningsChart) earningsChart.destroy();

  earningsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: "Gehalt",
          data: Object.values(salaryTotals),
          backgroundColor: "rgba(54, 162, 235, 0.85)", // Blau
          stack: "incomeStack",
        },
        {
          label: "Nebeneinkünfte",
          data: Object.values(sideTotals),
          backgroundColor: "rgba(255, 159, 64, 0.85)", // Orange
          stack: "incomeStack",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true },
      },
    },
  });
}
