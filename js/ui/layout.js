document.addEventListener("DOMContentLoaded", () => {
  // Sidebar laden
  fetch("sidebar.html")
    .then((res) => res.text())
    .then((html) => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.innerHTML = html;
        sidebar.classList.add("h-screen");
      }
    });

  // Monate dynamisch erstellen
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

  if (!monthsContainer) {
    console.warn("⚠️ Kein Element mit id='monthsContainer' gefunden!");
    return;
  }

  months.forEach((month) => {
    const divMonth = document.createElement("div");
    divMonth.className = "border border-gray-400 rounded-md py-2 px-6";
    divMonth.innerHTML = `<p>${month}</p>`;
    monthsContainer.appendChild(divMonth);
  });

  document.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  });
});
