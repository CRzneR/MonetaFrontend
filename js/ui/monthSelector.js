export function initMonthSelector() {
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

  const monthsContainer = document.getElementById("monthsContainer");
  if (!monthsContainer) return;

  const isMobile = window.matchMedia("(max-width: 767px)");

  function render() {
    monthsContainer.innerHTML = "";
    monthsContainer.className = "";

    // 📱 Mobile → Dropdown
    if (isMobile.matches) {
      const wrapper = document.createElement("div");
      wrapper.className = "bg-white border border-gray-300 rounded-lg p-4 mx-4 mt-4 ";

      wrapper.innerHTML = `
        <label class="block text-sm text-gray-600 mb-1">Monat auswählen</label>
        <select
          id="monthSelect"
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          ${months.map((m) => `<option value="${m}">${m}</option>`).join("")}
        </select>
      `;

      monthsContainer.appendChild(wrapper);
      return;
    }

    // 🖥️ Desktop → Grid
    monthsContainer.className = "flex w-full gap-4 py-4";

    months.forEach((month) => {
      const div = document.createElement("div");
      div.className =
        "flex-1 bg-white border border-gray-300 rounded-lg py-3  text-center cursor-pointer hover:bg-gray-50 transition";

      div.textContent = month;
      div.dataset.month = month;

      monthsContainer.appendChild(div);
    });
  }

  render();
  isMobile.addEventListener("change", render);
}
