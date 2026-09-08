/* ==========================================================================
   PLANIFY - Página de inicio
   - Inyecta navbar y footer
   - Carga destinos destacados desde REST Countries
   - Búsqueda rápida desde el hero
   - Manejo de favoritos en las tarjetas destacadas
   ========================================================================== */

"use strict";

(function () {
  // Página "Inicio" (índice 0). basePath="" porque estamos en la raíz.
  injectNavbar("", 0);
  injectFooter();

  const FEATURED_CODES = ["COL", "JPN", "FRA", "ITA", "AUS", "BRA", "ESP", "EGY"];

  /* ----------------------------------------------------------------------
     Destinos destacados
     ---------------------------------------------------------------------- */
  async function loadFeatured() {
    const grid = document.getElementById("featuredGrid");
    if (!grid) return;

    try {
      const allCountries = await fetchAllCountries();

      // Estrategia 1: buscar los países destacados por código
      let featured = FEATURED_CODES
        .map((code) => allCountries.find((c) => c.cca3 === code))
        .filter(Boolean);

      // Estrategia 2 (respaldo): si faltan, completar con países de la lista
      if (featured.length < 8) {
        const rest = allCountries.filter((c) => !FEATURED_CODES.includes(c.cca3));
        featured = featured.concat(rest.slice(0, 8 - featured.length));
      }

      renderFeatured(featured, grid);
    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1;">
          <div class="error-icon">🌐</div>
          <h3>No pudimos cargar los destinos destacados</h3>
          <p>${escapeHtml(err.message || "Revisa tu conexión a internet e intenta de nuevo.")}</p>
          <div style="margin-top:16px;"><button class="btn btn-primary" onclick="window.location.reload()">Reintentar</button></div>
        </div>`;
    }
  }

  function renderFeatured(countries, grid) {
    grid.innerHTML = countries
      .map((c) => countryCardHTML(c, "pages/detail.html"))
      .join("");

    // Clic en la tarjeta -> ir al detalle (pero no si hacen clic en favoritos)
    grid.querySelectorAll(".country-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".fav-toggle")) return;
        const link = card.querySelector("a.btn");
        if (link) window.location.href = link.getAttribute("href");
      });
    });

    bindFavoriteButtons(grid);
  }

  /* ----------------------------------------------------------------------
     Lógica compartida de favoritos (heart)
     ---------------------------------------------------------------------- */
  function bindFavoriteButtons(container) {
    container.querySelectorAll(".fav-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = btn.dataset.fav;
        const saved = btn.classList.contains("saved");

        if (saved) {
          removeFavorite(code);
          btn.classList.remove("saved");
          btn.querySelector("i").className = "bi bi-heart";
          btn.title = "Agregar a favoritos";
          showToast("Destino eliminado de favoritos", "info");
        } else {
          // Reconstruir un objeto mínimo de país desde el DOM para guardarlo
          const name = btn.dataset.name;
          const country = buildCountryFromCard(btn.closest(".country-card"), name, code);
          const result = addFavorite(country);

          if (result.ok && !result.duplicate) {
            btn.classList.add("saved");
            btn.querySelector("i").className = "bi bi-heart-fill";
            btn.title = "Quitar de favoritos";
            showToast(`${name} agregado a favoritos`, "success");
          } else if (result.duplicate) {
            showToast("Ya está en tus favoritos", "info");
          } else {
            showToast("No se pudo guardar el favorito", "error");
          }
        }
      });
    });
  }

  // Reconstruye el objeto de país que espera addFavorite()
  function buildCountryFromCard(card, name, cca3) {
    const meta = card.querySelectorAll(".country-meta span");
    const region = meta[0] ? meta[0].textContent.replace(/^\s*[^\w\s]+\s*/, "").trim() : "";
    const populationText = meta[1] ? meta[1].textContent.replace(/[^\d]/g, "") : "0";
    const img = card.querySelector("img");
    const capitalText = card.querySelector(".country-capital").textContent.trim();

    return {
      cca3,
      name: { common: name },
      capital: capitalText === "Sin capital" ? [] : [capitalText],
      region,
      population: Number(populationText),
      flags: { svg: img ? img.src : "" },
    };
  }

  /* ----------------------------------------------------------------------
     Búsqueda desde el hero
     ---------------------------------------------------------------------- */
  function setupHeroSearch() {
    const form = document.getElementById("heroSearchForm");
    const input = document.getElementById("heroSearchInput");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = input.value.trim();

      if (!query) {
        showToast("Escribe un destino para buscar", "info");
        return;
      }

      // Redirigimos a "Explorar" con la búsqueda en la URL
      window.location.href = `pages/explore.html?q=${encodeURIComponent(query)}`;
    });
  }

  /* ----------------------------------------------------------------------
     Inicio de la página
     ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    loadFeatured();
    setupHeroSearch();
  });
})();