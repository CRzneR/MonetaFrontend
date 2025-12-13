// =======================================
// EINNAHMEN – FRONTEND LOGIK
// =======================================

// API-Basis korrekt bestimmen
const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : location.origin;

const INCOME_URL = `${API_BASE}/api/income`;

let earningsChart = null;

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

    const saved = await res.json();

    addIncomeBox(saved);
    updateChart();

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
    const res = await fetch(INCOME_URL, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const incomes = await res.json();

    incomes.forEach(addIncomeBox);
    renderChart(incomes);
  } catch (err) {
    console.error("Load income error:", err);
  }
}

// =======================================
// Einnahme-Box in die UI einfügen
// =======================================
function addIncomeBox(inc) {
  const container = document.getElementById("incomeContainer");

  const div = document.createElement("div");
  div.className = "relative min-w-[200px] bg-white border border-gray-300 rounded-xl p-4 shadow";

  div.innerHTML = `
    <button 
      class="deleteIncomeBtn absolute top-2 right-2 text-red-600 hover:text-red-800"
      data-id="${inc._id}">
        🗑️
    </button>

    <p class="font-semibold">${inc.source}</p>
    <p>${inc.amount.toFixed(2)} €</p>
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

    // Eintrag aus UI entfernen
    e.target.closest("div").remove();

    // Chart aktualisieren
    updateChart();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Serverfehler beim Löschen!");
  }
}

// =======================================
// Chart erstellen
// =======================================
function renderChart(incomes) {
  const months = [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ];

  const salaryTotals = {};
  const sideTotals = {};

  // Startwerte auf 0 setzen
  months.forEach((m) => {
    salaryTotals[m] = 0;
    sideTotals[m] = 0;
  });

  // Einnahmen sortieren
  incomes.forEach((i) => {
    if (i.category === "Gehalt") {
      salaryTotals[i.month] += i.amount;
    } else if (i.category === "Nebeneinkünfte") {
      sideTotals[i.month] += i.amount;
    }
  });

  const ctx = document.getElementById("earningsChart");

  if (earningsChart) earningsChart.destroy();

  earningsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
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

// =======================================
// Chart aktualisieren
// =======================================
async function updateChart() {
  const res = await fetch(INCOME_URL, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });

  const incomes = await res.json();
  renderChart(incomes);
}
