/* ==========================================================================
   PLANIFY - Página "Explorar destinos"
   - Obtiene todos los países de REST Countries
   - Búsqueda por nombre, capital o código
   - Filtro por región
   - Tarjetas dinámicas con bandera, nombre, capital, región y población
   - Lógica de favoritos
   ========================================================================== */

"use strict";

(function () {
  // Página "Explorar" (índice 1). basePath="../" porque estamos en /pages
  injectNavbar("../", 1);
  injectFooter("../");

  let allCountries = [];
  let currentQuery = "";
  let currentRegion = "all";

  const grid = document.getElementById("countriesGrid");
  const resultCount = document.getElementById("resultCount");
  const messageArea = document.getElementById("messageArea");
  const searchInput = document.getElementById("searchInput");

  /* ----------------------------------------------------------------------
     Carga inicial de todos los países
     ---------------------------------------------------------------------- */
  async function loadCountries() {
    showLoading();
    messageArea.innerHTML = "";

    try {
      allCountries = await fetchAllCountries();
      allCountries.sort((a, b) => (a.name.common || "").localeCompare(b.name.common || ""));

      applyFilters();
    } catch (err) {
      console.error(err);
      messageArea.innerHTML = `
        <div class="message message-error">
          <span class="msg-icon"><i class="bi bi-wifi-off"></i></span>
          <span>${escapeHtml(err.message || "No pudimos cargar los destinos.")}</span>
        </div>`;
      grid.innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1;">
          <div class="error-icon">🌐</div>
          <h3>Error al cargar los destinos</h3>
          <p>${escapeHtml(err.message || "Parece que no hay conexión. Intenta más tarde.")}</p>
          <div style="margin-top:16px;"><button class="btn btn-primary" onclick="window.location.reload()">Reintentar</button></div>
        </div>`;
      if (resultCount) resultCount.textContent = "";
    }
  }

  /* ----------------------------------------------------------------------
     Filtros: región + búsqueda
     ---------------------------------------------------------------------- */
  function applyFilters() {
    let list = allCountries;

    // Filtro por región
    if (currentRegion !== "all") {
      list = list.filter((c) => c.region === currentRegion);
    }

    // Búsqueda por nombre, capital o código
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      list = list.filter((c) => {
        const name = (c.name?.common ?? "").toLowerCase();
        const capital = (c.capital?.[0] ?? "").toLowerCase();
        const code = (c.cca3 ?? "").toLowerCase();
        return name.includes(q) || capital.includes(q) || code.includes(q);
      });
    }

    renderCountries(list);
  }

  function renderCountries(list) {
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No encontramos países con esos criterios. Prueba con otra búsqueda o región.</p>
        </div>`;
      if (resultCount) resultCount.textContent = "0 resultados";
      return;
    }

    grid.innerHTML = list.map((c) => countryCardHTML(c)).join("");

    if (resultCount) resultCount.textContent = `${list.length} ${list.length === 1 ? "resultado" : "resultados"}`;

    bindCards();
  }

  /* ----------------------------------------------------------------------
     Interacciones de las tarjetas
     ---------------------------------------------------------------------- */
  function bindCards() {
    // Navegación al detalle al hacer clic en la tarjeta
    grid.querySelectorAll(".country-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".fav-toggle")) return;
        const link = card.querySelector("a.btn");
        if (link) window.location.href = link.getAttribute("href");
      });
    });

    // Favoritos
    grid.querySelectorAll(".fav-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(btn);
      });
    });
  }

  function toggleFavorite(btn) {
    const code = btn.dataset.fav;
    const name = btn.dataset.name;

    if (btn.classList.contains("saved")) {
      removeFavorite(code);
      btn.classList.remove("saved");
      btn.querySelector("i").className = "bi bi-heart";
      btn.title = "Agregar a favoritos";
      showToast(`${name} eliminado de favoritos`, "info");
    } else {
      const country = allCountries.find((c) => (c.cca3 || "") === code);
      if (!country) return;
      const result = addFavorite(country);

      if (result.ok && !result.duplicate) {
        btn.classList.add("saved");
        btn.querySelector("i").className = "bi bi-heart-fill";
        btn.title = "Quitar de favoritos";
        showToast(`${name} agregado a favoritos`, "success");
      } else if (result.duplicate) {
        showToast("El destino ya está en favoritos", "info");
      } else {
        showToast("No se pudo guardar el favorito", "error");
      }
    }
  }

  /* ----------------------------------------------------------------------
     Estados visuales
     ---------------------------------------------------------------------- */
  function showLoading() {
    grid.innerHTML = `
      <div class="loading-state" style="grid-column: 1 / -1;">
        <div class="spinner"></div>
        <p>Cargando países...</p>
      </div>`;
    if (resultCount) resultCount.textContent = "";
  }

  /* ----------------------------------------------------------------------
     Eventos
     ---------------------------------------------------------------------- */
  function setupEvents() {
    // Filtros por región
    document.querySelectorAll("#regionFilters .filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#regionFilters .filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentRegion = btn.dataset.region;
        applyFilters();
      });
    });

    // Búsqueda con submit + en vivo mientras se escribe
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        currentQuery = searchInput.value.trim();
        applyFilters();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentQuery = searchInput.value.trim();
        applyFilters();
      });
    }
  }

  /* ----------------------------------------------------------------------
     Arranque: lee el parámetro ?q= si venimos del buscador del hero
     ---------------------------------------------------------------------- */
  function readInitialQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      currentQuery = q;
      if (searchInput) searchInput.value = q;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    readInitialQuery();
    setupEvents();
    loadCountries();
  });
})();