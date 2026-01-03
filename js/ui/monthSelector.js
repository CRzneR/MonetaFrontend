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

  const now = new Date();
  const defaultMonth = months[now.getMonth()];
  const defaultYear = String(now.getFullYear());

  function getSelectedMonth() {
    return localStorage.getItem("selectedMonth") || defaultMonth;
  }
  function getSelectedYear() {
    return localStorage.getItem("selectedYear") || defaultYear;
  }

  function setSelected(month, year) {
    localStorage.setItem("selectedMonth", month);
    localStorage.setItem("selectedYear", String(year));

    document.dispatchEvent(
      new CustomEvent("month:changed", { detail: { month, year: String(year) } })
    );
  }

  function highlightActiveDesktop() {
    const selected = getSelectedMonth();
    monthsContainer.querySelectorAll("[data-month]").forEach((el) => {
      const active = el.dataset.month === selected;

      el.classList.toggle("bg-purple-600", active);
      el.classList.toggle("text-white", active);
      el.classList.toggle("border-purple-600", active);

      if (!active) {
        el.classList.add("bg-white", "text-black");
        el.classList.remove("bg-purple-600", "text-white", "border-purple-600");
      }
    });
  }

  function render() {
    monthsContainer.innerHTML = "";
    monthsContainer.className = "";

    const selectedMonth = getSelectedMonth();

    // 📱 Mobile → Dropdown
    if (isMobile.matches) {
      const wrapper = document.createElement("div");
      wrapper.className = "bg-white border border-gray-300 rounded-lg p-4 mx-4 mt-4";

      wrapper.innerHTML = `
        <label class="block text-sm text-gray-600 mb-1">Monat auswählen</label>
        <select
          id="monthSelect"
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          ${months
            .map(
              (m) => `<option value="${m}" ${m === selectedMonth ? "selected" : ""}>${m}</option>`
            )
            .join("")}
        </select>
      `;

      monthsContainer.appendChild(wrapper);

      const select = wrapper.querySelector("#monthSelect");
      select.addEventListener("change", (e) => {
        setSelected(e.target.value, getSelectedYear());
      });

      return;
    }

    // 🖥️ Desktop → Buttons
    monthsContainer.className = "flex w-full gap-4 py-4";

    months.forEach((month) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "flex-1 bg-white border border-gray-300 rounded-lg py-3 text-center cursor-pointer hover:bg-gray-50 transition";

      btn.textContent = month;
      btn.dataset.month = month;

      btn.addEventListener("click", () => {
        setSelected(month, getSelectedYear());
        highlightActiveDesktop();
      });

      monthsContainer.appendChild(btn);
    });

    highlightActiveDesktop();
  }

  // Defaults setzen, falls noch nichts gespeichert
  if (!localStorage.getItem("selectedMonth")) localStorage.setItem("selectedMonth", defaultMonth);
  if (!localStorage.getItem("selectedYear")) localStorage.setItem("selectedYear", defaultYear);

  render();
  isMobile.addEventListener("change", render);

  // initial event -> erste Seite lädt direkt
  document.dispatchEvent(
    new CustomEvent("month:changed", {
      detail: { month: getSelectedMonth(), year: getSelectedYear() },
    })
  );
}
