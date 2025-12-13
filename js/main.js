import { initFixCostPage } from "./ui/fixCost.js";
import { initIncomePage } from "./ui/income.js";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "fixcosts") {
    initFixCostPage(); // ⭐ richtig
  }

  if (page === "income") {
    initIncomePage(); // ⭐ richtig
  }
});
