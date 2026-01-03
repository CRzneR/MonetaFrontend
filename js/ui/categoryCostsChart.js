// frontend/js/ui/categoryCostsChart.js

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function monthToNumber(monthLabel) {
  const idx = MONTHS.indexOf(monthLabel);
  return idx === -1 ? null : idx + 1;
}

function monthKey(year, monthLabel) {
  const m = monthToNumber(monthLabel);
  if (!m || !year) return null;
  return `${year}-${String(m).padStart(2, "0")}`; // z.B. 2026-02
}

function makeColors(n) {
  // einfache, stabile HSL-Palette
  const colors = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.round((360 / Math.max(n, 1)) * i);
    colors.push(`hsl(${hue} 70% 55%)`);
  }
  return colors;
}

export function updateCategoryCostsChart(
  costs,
  { canvasId = "categoryChart", monthLabel, year } = {}
) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  // ✅ vorhandenes Chart auf diesem Canvas zerstören
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const key = monthLabel && year ? monthKey(String(year), monthLabel) : null;

  // Kategorie-Summen aus "effektivem Wert" berechnen:
  // Abgebucht (für den ausgewählten Monat) zählt, sonst Kosten
  const totals = {};
  for (const c of costs || []) {
    const cat = (c?.kategorie || "Unbekannt").trim();
    const kosten = Number(c?.kosten) || 0;

    const abg = key && c?.abgebuchtByMonth ? c.abgebuchtByMonth[key] : null;
    const effective = abg !== null && abg !== undefined && abg !== "" ? Number(abg) : kosten;

    totals[cat] = (totals[cat] || 0) + (Number.isFinite(effective) ? effective : 0);
  }

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  let labels = entries.map(([k]) => k);
  let data = entries.map(([, v]) => Number(v.toFixed(2)));

  // Fallback, damit das Chart nie "leer" ist
  if (labels.length === 0) {
    labels = ["Keine Daten"];
    data = [1];
  }

  const bg = makeColors(labels.length);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Kosten (effektiv)",
          data,
          backgroundColor: bg,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${Number(ctx.parsed || 0).toFixed(2)} €`,
          },
        },
      },
    },
  });
}
