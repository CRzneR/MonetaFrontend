import { updateCategoryCostsChart } from "./categoryCostsChart.js";

export async function initDashboardPage() {
  // 🔒 Nur rendern, wenn Canvas existiert
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;

  updateCategoryCostsChart(costs, { canvasId: "categoryChart" });
}
