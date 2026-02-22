// =======================================
// EINNAHMEN – FRONTEND LOGIK (Session Auth)
// =======================================

const INCOME_URL = "/api/income";

let earningsChart = null;

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// =======================================
// 🔐 Session prüfen
// =======================================
async function ensureLoggedIn() {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (!res.ok) {
    window.location.href = "/pages/login.html";
    return false;
  }

  return true;
}

// =======================================
// INIT
// =======================================
export async function initIncomePage() {
  const ok = await ensureLoggedIn();
  if (!ok) return;

  console.log("📄 Einnahmen-Seite wird initialisiert...");

  const addIncomeBtn = document.getElementById("addIncomeBtn");
  const incomeOverlay = document.getElementById("incomeOverlay");
  const cancelIncomeBtn = document.getElementById("cancelIncomeBtn");
  const saveIncomeBtn = document.getElementById("saveIncomeBtn");

  addIncomeBtn?.addEventListener("click", () => {
    incomeOverlay.classList.remove("hidden");
  });

  cancelIncomeBtn?.addEventListener("click", () => {
    incomeOverlay.classList.add("hidden");
  });

  saveIncomeBtn?.addEventListener("click", saveIncome);

  document.addEventListener("click", handleDelete);

  loadIncome();
}

// =======================================
// POST – Einnahme speichern
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

  const res = await fetch(INCOME_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newIncome),
  });

  if (!res.ok) {
    alert("❌ Fehler beim Speichern der Einnahme!");
    return;
  }

  await refreshIncomeUI();

  document.getElementById("incomeOverlay").classList.add("hidden");
  document.getElementById("incomeForm").reset();
}

// =======================================
// GET – Einnahmen laden
// =======================================
async function loadIncome() {
  await refreshIncomeUI();
}

// =======================================
// UI neu rendern
// =======================================
async function refreshIncomeUI() {
  const res = await fetch(INCOME_URL, {
    credentials: "include",
  });

  const incomes = await res.json();

  renderIncomeBoxes(incomes);
  renderChart(incomes);
  displayMonthlyAverage(incomes);
  displaySideIncomeMoM(incomes);
}

// =======================================
// Einnahme-Boxen
// =======================================
function renderIncomeBoxes(incomes) {
  const container = document.getElementById("incomeContainer");
  if (!container) return;

  container.innerHTML = "";
  incomes.forEach(addIncomeBox);
}

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
// DELETE
// =======================================
async function handleDelete(e) {
  if (!e.target.classList.contains("deleteIncomeBtn")) return;

  const id = e.target.dataset.id;

  if (!confirm("Diese Einnahme wirklich löschen?")) return;

  const res = await fetch(`${INCOME_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    alert("Fehler beim Löschen!");
    return;
  }

  await refreshIncomeUI();
}

// =======================================
// Statistik-Funktionen
// =======================================
function calculateMonthlyAverage(incomes) {
  if (!incomes.length) return 0;

  const monthsWithData = new Set();
  let total = 0;

  incomes.forEach((i) => {
    total += Number(i.amount) || 0;
    if (i.month) monthsWithData.add(i.month);
  });

  return total / (monthsWithData.size || 1);
}

function displayMonthlyAverage(incomes) {
  const container = document.getElementById("arvgIncome");
  if (!container) return;

  const avg = calculateMonthlyAverage(incomes);

  container.innerHTML = `
    <div class="text-sm text-gray-500">Ø Einnahmen pro Monat</div>
    <div class="text-2xl font-bold">${avg.toFixed(2)} €</div>
  `;
}

function getSideTotalsByMonth(incomes) {
  const totals = {};
  MONTHS.forEach((m) => (totals[m] = 0));

  incomes.forEach((inc) => {
    if (inc.category === "Nebeneinkünfte") {
      totals[inc.month] += Number(inc.amount) || 0;
    }
  });

  return totals;
}

function displaySideIncomeMoM(incomes) {
  const container = document.getElementById("sideIncomeMoM");
  if (!container) return;

  const totals = getSideTotalsByMonth(incomes);

  const lastIdx = [...MONTHS.keys()].filter((i) => totals[MONTHS[i]] > 0).pop();

  if (lastIdx === undefined) {
    container.textContent = "Nebeneinkünfte: keine Daten.";
    return;
  }

  const curr = totals[MONTHS[lastIdx]];
  const prev = totals[MONTHS[(lastIdx + 11) % 12]];

  if (prev === 0) {
    container.textContent = "–";
    return;
  }

  const pct = ((curr - prev) / prev) * 100;
  container.textContent = `${pct > 0 ? "▲" : "▼"} ${pct.toFixed(1)}%`;
}

// =======================================
// Chart
// =======================================
function renderChart(incomes) {
  const salaryTotals = {};
  const sideTotals = {};

  MONTHS.forEach((m) => {
    salaryTotals[m] = 0;
    sideTotals[m] = 0;
  });

  incomes.forEach((i) => {
    if (i.category === "Gehalt") salaryTotals[i.month] += Number(i.amount) || 0;
    else if (i.category === "Nebeneinkünfte") sideTotals[i.month] += Number(i.amount) || 0;
  });

  const ctx = document.getElementById("earningsChart");
  if (!ctx) return;

  if (earningsChart) earningsChart.destroy();

  earningsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        { label: "Gehalt", data: Object.values(salaryTotals), stack: "s" },
        { label: "Nebeneinkünfte", data: Object.values(sideTotals), stack: "s" },
      ],
    },
    options: {
      responsive: true,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    },
  });
}
