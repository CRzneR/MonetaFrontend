"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:5001/api/income";

  const labels = [
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
  const chartData = {
    labels,
    datasets: [
      { label: "Gehalt", data: Array(12).fill(0), backgroundColor: "#EF4444" },
      { label: "Nebeneinkünfte", data: Array(12).fill(0), backgroundColor: "#3B82F6" },
    ],
  };

  const ctx = document.getElementById("earningsChart")?.getContext("2d");
  const earningsChart = ctx
    ? new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: {
          responsive: true,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        },
      })
    : null;

  function addToChart(income) {
    const monthIndex = chartData.labels.indexOf(income.month);
    if (monthIndex === -1) return;
    const dataset = income.category === "Gehalt" ? chartData.datasets[0] : chartData.datasets[1];
    dataset.data[monthIndex] = (dataset.data[monthIndex] || 0) + income.amount;
    earningsChart?.update();
  }

  function resetChart() {
    chartData.datasets.forEach((ds) => (ds.data = Array(12).fill(0)));
  }

  const addIncomeBtn = document.getElementById("addIncomeBtn");
  const incomeOverlay = document.getElementById("incomeOverlay");
  const saveIncomeBtn = document.getElementById("saveIncomeBtn");
  const cancelIncomeBtn = document.getElementById("cancelIncomeBtn");
  const incomeContainer = document.getElementById("incomeContainer");

  if (addIncomeBtn && incomeOverlay && saveIncomeBtn && cancelIncomeBtn && incomeContainer) {
    addIncomeBtn.addEventListener("click", () => incomeOverlay.classList.remove("hidden"));
    cancelIncomeBtn.addEventListener("click", () => {
      incomeOverlay.classList.add("hidden");
      ["incomeAmount", "incomeSource", "incomeMonth", "incomeCategory"].forEach(
        (id) => (document.getElementById(id).value = "")
      );
    });

    saveIncomeBtn.addEventListener("click", async () => {
      const amount = parseFloat(
        document.getElementById("incomeAmount").value.trim().replace(",", ".")
      );
      const source = document.getElementById("incomeSource").value.trim();
      const month = document.getElementById("incomeMonth").value;
      const category = document.getElementById("incomeCategory").value;

      if (!amount || !source || !month || !category || isNaN(amount)) {
        alert("Bitte alle Felder korrekt ausfüllen!");
        return;
      }

      const income = { amount, source, month, category };

      // Backend speichern
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(income),
      });
      const saved = await res.json();

      // UI aktualisieren
      renderIncomeCard(saved);
      addToChart(saved);
      incomeOverlay.classList.add("hidden");
      ["incomeAmount", "incomeSource", "incomeMonth", "incomeCategory"].forEach(
        (id) => (document.getElementById(id).value = "")
      );
    });

    incomeContainer.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("deleteIncome")) return;

      const card = e.target.closest("div[data-id]");
      const id = card?.dataset?.id;

      if (!id || id === "undefined") {
        console.warn("⚠️ Kein gültiges income._id gefunden:", card);
        return;
      }

      try {
        await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
        card.remove();
        await loadIncomesFromDB();
      } catch (err) {
        console.error("Fehler beim Löschen:", err);
      }
    });
  }

  async function loadIncomesFromDB() {
    const res = await fetch(API_URL);
    const incomes = await res.json();
    incomeContainer.innerHTML = "";
    resetChart();
    incomes.forEach((income) => {
      renderIncomeCard(income);
      addToChart(income);
    });
  }

  function renderIncomeCard(income) {
    const div = document.createElement("div");
    div.className =
      "h-32 w-32 bg-green-100 border border-green-400 p-4 rounded-xl flex flex-col justify-between";
    div.dataset.id = income._id;
    div.innerHTML = `
      <div>
        <p class="font-bold text-lg">${income.amount.toFixed(2)} €</p>
        <p class="text-sm">${income.source}</p>
      </div>
      <button class="deleteIncome text-red-600 text-sm hover:underline self-end">Löschen</button>
    `;
    incomeContainer.appendChild(div);
  }

  // Initial laden
  loadIncomesFromDB();
});
