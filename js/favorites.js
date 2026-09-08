/* ==========================================================================
   PLANIFY - Página "Favoritos"
   - Lista los destinos guardados en localStorage
   - Permite quitarlos (sin duplicados, sin fallos)
   ========================================================================== */

"use strict";

(function () {
  injectNavbar("../", 2);
  injectFooter("../");

  const grid = document.getElementById("favoritesGrid");
  const emptyState = document.getElementById("emptyState");
  const messageArea = document.getElementById("messageArea");

  document.addEventListener("DOMContentLoaded", renderFavorites);

  function renderFavorites() {
    const favorites = getFavorites();

    // Mostrar / ocultar estado vacío
    emptyState.style.display = favorites.length === 0 ? "block" : "none";

    if (favorites.length === 0) {
      grid.innerHTML = "";
      return;
    }

    grid.innerHTML = favorites
      .map((c) => favoriteCardHTML(c))
      .join("");

    bindActions();
  }

  // Reutiliza countryCardHTML construyendo el objeto que espera
  function favoriteCardHTML(fav) {
    const country = {
      cca3: fav.cca3,
      name: { common: fav.name },
      capital: fav.capital ? [fav.capital] : [],
      region: fav.region || "",
      population: fav.population,
      flags: { svg: fav.flag },
    };
    return countryCardHTML(country);
  }

  function bindActions() {
    // Navegar al detalle al hacer clic en la tarjeta
    grid.querySelectorAll(".country-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".fav-toggle")) return;
        const link = card.querySelector("a.btn");
        if (link) window.location.href = link.getAttribute("href");
      });
    });

    // Quitar favorito (el corazón siempre aparece lleno aquí)
    grid.querySelectorAll(".fav-toggle").forEach((btn) => {
      btn.classList.add("saved");
      btn.querySelector("i").className = "bi bi-heart-fill";

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = btn.dataset.fav;
        const name = btn.dataset.name;

        removeFavorite(code);
        showToast(`${name} eliminado de favoritos`, "info");
        // Re-render sin recargar
        renderFavorites();
      });
    });
  }
})();