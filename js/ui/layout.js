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

  document.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  });
});
