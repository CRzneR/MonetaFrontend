export function createPageMenu(title) {
  const menu = document.createElement("div");
  menu.id = "pageMenu";
  menu.className = "hidden md:flex h-12  justify-between px-4 ml-2 text-black";

  menu.innerHTML = `
    <div class="flex items-center">
      <p class="font-medium">${title}</p>
    </div>

    <div class="flex items-center space-x-4">
      <button
        id="notificationBtn"
        class="text-gray-400 hover:text-black cursor-pointer"
        aria-label="Benachrichtigungen"
      >
        🔔
      </button>

      <p id="username" class="font-medium"></p>

      <button id="profileBtn" aria-label="Profil">
        <img
          src="https://via.placeholder.com/32"
          alt="Profilbild"
          class="w-8 h-8 rounded-full border border-gray-400"
        />
      </button>
    </div>
  `;

  return menu;
}
