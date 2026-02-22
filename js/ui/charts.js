"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:5001/api/income";

  // Standard: aktuelles Jahr anzeigen/verwenden
  const CURRENT_YEAR = new Date().getFullYear();
  let selectedYear = CURRENT_YEAR;

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

  // Jahres-Dropdown
  const yearSelect = document.getElementById("yearSelect");

  function initYearDropdown(startYear = CURRENT_YEAR - 3, endYear = CURRENT_YEAR + 1) {
    if (!yearSelect) return;

    yearSelect.innerHTML = "";

    for (let y = endYear; y >= startYear; y--) {
      const option = document.createElement("option");
      option.value = String(y);
      option.textContent = String(y);
      if (y === selectedYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  }

  yearSelect?.addEventListener("change", async () => {
    selectedYear = parseInt(yearSelect.value, 10);
    await loadIncomesFromDB();
  });

  function addToChart(income) {
    // Nur  ausgewählte Jahr in den Chart nehmen
    if (income?.year !== selectedYear) return;

    const monthIndex = chartData.labels.indexOf(income.month);
    if (monthIndex === -1) return;

    const dataset = income.category === "Gehalt" ? chartData.datasets[0] : chartData.datasets[1];
    dataset.data[monthIndex] = (dataset.data[monthIndex] || 0) + income.amount;

    earningsChart?.update();
  }

  function resetChart() {
    chartData.datasets.forEach((ds) => (ds.data = Array(12).fill(0)));
    earningsChart?.update();
  }

  const addIncomeBtn = document.getElementById("addIncomeBtn");
  const incomeOverlay = document.getElementById("incomeOverlay");
  const saveIncomeBtn = document.getElementById("saveIncomeBtn");
  const cancelIncomeBtn = document.getElementById("cancelIncomeBtn");
  const incomeContainer = document.getElementById("incomeContainer");

  // Falls  HTML das Jahr-Feld im Overlay enthält
  const incomeYearInput = document.getElementById("incomeYear");

  // Jahr-Feld falls vorhanden
  if (incomeYearInput) {
    incomeYearInput.value = String(selectedYear);
  }

  if (addIncomeBtn && incomeOverlay && saveIncomeBtn && cancelIncomeBtn && incomeContainer) {
    addIncomeBtn.addEventListener("click", () => {
      // Beim Öffnen: Overlay-Jahr auf aktuell gewähltes Jahr setzen
      if (incomeYearInput) incomeYearInput.value = String(selectedYear);
      incomeOverlay.classList.remove("hidden");
    });

    cancelIncomeBtn.addEventListener("click", () => {
      incomeOverlay.classList.add("hidden");

      ["incomeAmount", "incomeSource", "incomeMonth", "incomeCategory"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.value = "";
      });

      // Jahr zurück auf ausgewähltes Jahr (falls Feld existiert)
      if (incomeYearInput) incomeYearInput.value = String(selectedYear);
    });

    saveIncomeBtn.addEventListener("click", async () => {
      const amount = parseFloat(
        (document.getElementById("incomeAmount")?.value || "").trim().replace(",", "."),
      );
      const source = (document.getElementById("incomeSource")?.value || "").trim();
      const month = document.getElementById("incomeMonth")?.value || "";
      const category = document.getElementById("incomeCategory")?.value || "";

      // Jahr auslesen (falls Feld existiert), sonst selectedYear
      const year = incomeYearInput ? parseInt(incomeYearInput.value, 10) : selectedYear;

      if (!amount || !source || !month || !category || !year || isNaN(amount)) {
        alert("Bitte alle Felder korrekt ausfüllen!");
        return;
      }

      const income = { amount, source, month, category, year };

      try {
        // Backend speichern
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(income),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("POST /api/income fehlgeschlagen:", errBody);
          alert("Fehler beim Speichern der Einnahme!");
          return;
        }

        const saved = await res.json();

        // UI aktualisieren
        if (saved.year === selectedYear) {
          renderIncomeCard(saved);
          addToChart(saved);
        } else {
          // Falls user ein anderes Jahr eingetragen hat neu laden
          await loadIncomesFromDB();
        }

        incomeOverlay.classList.add("hidden");

        ["incomeAmount", "incomeSource", "incomeMonth", "incomeCategory"].forEach((id) => {
          const eNumb = document.getElementById(id);
          if (eNumb) eNumb.value = "";
        });

        if (incomeYearInput) incomeYearInput.value = String(selectedYear);
      } catch (err) {
        console.error("Fehler beim Speichern:", err);
        alert("Fehler beim Speichern der Einnahme!");
      }
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
        const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
          console.error("DELETE fehlgeschlagen:", await res.text());
          alert("Fehler beim Löschen!");
          return;
        }

        card.remove();

        // Nach Löschen neu laden (inkl. Chart reset)
        await loadIncomesFromDB();
      } catch (err) {
        console.error("Fehler beim Löschen:", err);
        alert("Fehler beim Löschen!");
      }
    });
  }

  async function loadIncomesFromDB() {
    // Nur ausgewähltes Jahr laden
    const res = await fetch(`${API_URL}?year=${encodeURIComponent(selectedYear)}`);
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
        <p class="font-bold text-lg">${Number(income.amount).toFixed(2)} €</p>
        <p class="text-sm">${income.source}</p>
        <p class="text-xs text-gray-600">${income.month} ${income.year}</p>
      </div>
      <button class="deleteIncome text-red-600 text-sm hover:underline self-end">Löschen</button>
    `;

    incomeContainer.appendChild(div);
  }

  // Initialisieren + Initial laden
  initYearDropdown();
  loadIncomesFromDB();
});
