/* ==========================================================================
   PLANIFY - Página "Detalle del destino"
   - Lee el país de la URL (?code=XXX)
   - Muestra toda la información del país (REST Countries)
   - Clima actual + pronóstico a 5 días (Open-Meteo)
   - Guardar / quitar favorito
   ========================================================================== */

"use strict";

(function () {
  injectNavbar("../", 1);
  injectFooter("../");

  let currentCountry = null;
  let isSaving = false;

  const messageArea = document.getElementById("messageArea");
  const loadingPanel = document.getElementById("loadingPanel");
  const detailContent = document.getElementById("detailContent");
  const errorPanel = document.getElementById("errorPanel");
  const errorText = document.getElementById("errorText");

  /* ----------------------------------------------------------------------
     Códigos meteorológicos WMO -> descripción e icono
     ---------------------------------------------------------------------- */
  const WEATHER_CODES = {
    0: { desc: "Cielo despejado", icon: "☀️" },
    1: { desc: "Mayormente despejado", icon: "🌤️" },
    2: { desc: "Parcialmente nublado", icon: "⛅" },
    3: { desc: "Cubierto", icon: "☁️" },
    45: { desc: "Niebla", icon: "🌫️" },
    48: { desc: "Niebla con escarcha", icon: "🌫️" },
    51: { desc: "Llovizna ligera", icon: "🌦️" },
    53: { desc: "Llovizna", icon: "🌦️" },
    55: { desc: "Llovizna intensa", icon: "🌧️" },
    56: { desc: "Llovizna helada", icon: "🌧️" },
    57: { desc: "Llovizna helada intensa", icon: "🌧️" },
    61: { desc: "Lluvia ligera", icon: "🌦️" },
    63: { desc: "Lluvia", icon: "🌧️" },
    65: { desc: "Lluvia fuerte", icon: "🌧️" },
    66: { desc: "Lluvia helada", icon: "🌧️" },
    67: { desc: "Lluvia helada intensa", icon: "🌧️" },
    71: { desc: "Nieve ligera", icon: "🌨️" },
    73: { desc: "Nieve", icon: "🌨️" },
    75: { desc: "Nieve intensa", icon: "❄️" },
    77: { desc: "Granos de nieve", icon: "❄️" },
    80: { desc: "Chubascos ligeros", icon: "🌦️" },
    81: { desc: "Chubascos", icon: "🌧️" },
    82: { desc: "Chubascos violentos", icon: "⛈️" },
    85: { desc: "Chubascos de nieve", icon: "🌨️" },
    86: { desc: "Chubascos de nieve fuertes", icon: "❄️" },
    95: { desc: "Tormenta", icon: "⛈️" },
    96: { desc: "Tormenta con granizo", icon: "⛈️" },
    99: { desc: "Tormenta con granizo fuerte", icon: "⛈️" },
  };

  function weatherInfo(code) {
    return (
      WEATHER_CODES[code] || { desc: "Condiciones variadas", icon: "🌡️" }
    );
  }

  /* ----------------------------------------------------------------------
     Carga del país
     ---------------------------------------------------------------------- */
  async function loadCountry(code) {
    try {
      currentCountry = await esLocalizeCountry(await fetchOneCountry(code));
      renderDetail(currentCountry);
    } catch (err) {
      console.error(err);
      showError(
        err.message === "País no encontrado"
          ? "El destino solicitado no existe o ya no está disponible."
          : err.message || "No se pudo cargar la información del destino."
      );
    }
  }

  /* ----------------------------------------------------------------------
     Render del detalle
     ---------------------------------------------------------------------- */
  function renderDetail(country) {
    loadingPanel.style.display = "none";
    detailContent.style.display = "block";

    const name = country.name?.common || country.name?.official || "Sin nombre";
    const capital = Array.isArray(country.capital) && country.capital[0]
      ? country.capital[0]
      : typeof country.capital === "string" && country.capital
        ? country.capital
        : "Sin información";
    const isIndependent = country.independent ? "Independiente" : "Territorio / dependencia";

    document.title = `${name} · Planify`;

    // Encabezado
    document.getElementById("detailTitle").textContent = name;
    document.getElementById("detailSubtitle").textContent =
      `Descubre todo sobre ${name} y su clima.`;
    document.getElementById("detailFlag").src = localProjectUrl(country.flags?.svg) || "";
    const detailFlagEl = document.getElementById("detailFlag");
    detailFlagEl.onerror = function () { flagFallback(detailFlagEl); };
    if (!country.flags?.svg) flagFallback(detailFlagEl);
    document.getElementById("detailFlag").alt = `Bandera de ${name}`;
    document.getElementById("detailName").textContent = name;
    document.getElementById("detailCapital").innerHTML =
      `<i class="bi bi-geo-alt"></i> Capital: ${capital}`;
    document.getElementById("detailRegionChip").innerHTML =
      `<i class="bi bi-globe2"></i> ${country.region || "Sin región"}`;
    document.getElementById("detailStatusChip").innerHTML =
      `<i class="bi bi-circle-fill"></i> ${isIndependent}`;

    // Información general
    document.getElementById("detailOfficialName").textContent =
      country.name?.official || "Sin información";
    document.getElementById("detailCapitalValue").textContent = capital;
    document.getElementById("detailRegion").textContent = country.region || "—";
    document.getElementById("detailSubregion").textContent = country.subregion || "—";
    document.getElementById("detailPopulation").textContent =
      formatNumber(country.population);
    document.getElementById("detailLanguages").textContent =
      Object.values(country.languages || {}).join(", ") || "Sin información";

    const currencies = currencyList(country.currencies);
    document.getElementById("detailCurrencies").textContent =
      currencies.length ? currencies.join(", ") : "Sin información";
    document.getElementById("detailCode").textContent = country.cca3 || "—";

    // Información geográfica
    const cLat = Number(country.latlng ? country.latlng[0] : NaN);
    const cLon = Number(country.latlng ? country.latlng[1] : NaN);
    document.getElementById("detailCoords").textContent =
      isFinite(cLat) && isFinite(cLon)
        ? `Lat ${cLat.toFixed(2)}°, Lon ${cLon.toFixed(2)}°`
        : "—";
    document.getElementById("detailArea").textContent =
      country.area ? `${formatNumber(Math.round(country.area))} km²` : "—";
    document.getElementById("detailTimezone").textContent =
      country.timezones && country.timezones[0] ? country.timezones[0] : "—";
    document.getElementById("detailCarSide").textContent =
      country.car?.side ? `Conduce por la ${country.car.side}` : "—";

    // Estado del botón favorito
    updateFavoriteUI();

    // Clima: usamos la capital si tiene coordenadas, si no el país
    const coords = resolveWeatherCoords(country);
    if (coords) {
      loadWeather(coords.lat, coords.lon);
    } else {
      showWeatherError();
    }
  }

  function resolveWeatherCoords(country) {
    // Resta llamar a geocodificación; usamos latlng del país (capital suele coincidir)
    if (country.latlng && country.latlng.length === 2) {
      return { lat: country.latlng[0], lon: country.latlng[1] };
    }
    return null;
  }

  /* ----------------------------------------------------------------------
     Clima
     ---------------------------------------------------------------------- */
  async function loadWeather(lat, lon) {
    try {
      const data = await fetchWeather(lat, lon);

      const current = data.current;
      const info = weatherInfo(current.weather_code);

      document.getElementById("weatherIcon").textContent = info.icon;
      document.getElementById("weatherTemp").textContent =
        `${Math.round(current.temperature_2m)}°C`;
      document.getElementById("weatherDesc").textContent = info.desc;
      document.getElementById("weatherWind").textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;
      document.getElementById("weatherRain").textContent =
        `${current.precipitation_probability ?? 0}%`;
      document.getElementById("weatherFeels").textContent =
        `${Math.round(current.apparent_temperature)}°C`;
      document.getElementById("weatherHumidity").textContent =
        `${current.relative_humidity_2m}%`;

      renderForecast(data.daily);
    } catch (err) {
      console.error(err);
      showWeatherError("No se pudo obtener el pronóstico en este momento.");
    }
  }

  function renderForecast(daily) {
    const grid = document.getElementById("forecastGrid");
    const days = daily.time.map((dateIso, i) => ({
      date: new Date(dateIso),
      code: daily.weather_code[i],
      tmax: daily.temperature_2m_max[i],
      tmin: daily.temperature_2m_min[i],
      rain: daily.precipitation_probability_max[i],
    }));

    grid.innerHTML = days
      .map((d) => {
        const info = weatherInfo(d.code);
        const label = d.date.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        return `
          <div class="forecast-day">
            <div class="fd-date">${label}</div>
            <div class="fd-icon">${info.icon}</div>
            <div class="fd-temp">${Math.round(d.tmax)}° / ${Math.round(d.tmin)}°</div>
            <div class="fd-desc">${info.desc}</div>
            <div class="fd-date" style="margin-top:4px;">💧 ${d.rain ?? 0}%</div>
          </div>`;
      })
      .join("");
  }

  function showWeatherError(msg = "No pudimos obtener el clima de este destino.") {
    const card = document.getElementById("weatherCard");
    card.innerHTML = `
      <h2><i class="bi bi-cloud-slash"></i> Clima no disponible</h2>
      <p style="opacity:.9; margin-top:12px;">${msg}</p>`;
    document.getElementById("forecastGrid").innerHTML =
      `<div class="error-state" style="padding:20px; grid-column:1/-1;">
         <div class="error-icon">☁️</div>
         <p style="margin-top:8px;">Pronóstico no disponible.</p>
       </div>`;
  }

  /* ----------------------------------------------------------------------
     Favoritos
     ---------------------------------------------------------------------- */
  function updateFavoriteUI() {
    const saved = isFavorite(currentCountry.cca3);
    const updaters = (btnEl, spanEl) => {
      if (!btnEl) return;
      btnEl.querySelector("i").className = saved ? "bi bi-heart-fill" : "bi bi-heart";
      spanEl.textContent = saved ? "Quitar de favoritos" : "Agregar a favoritos";
    };
    updaters(document.getElementById("favoriteBtn"), document.getElementById("favoriteBtn").querySelector("span"));
    updaters(document.getElementById("favoriteBtn2"), document.getElementById("favoriteBtn2").querySelector("span"));
  }

  function setupFavoriteButtons() {
    ["favoriteBtn", "favoriteBtn2"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (!currentCountry || isSaving) return;
        isSaving = true;
        const name = currentCountry.name?.common || "El destino";

        if (isFavorite(currentCountry.cca3)) {
          removeFavorite(currentCountry.cca3);
          showToast(`${name} eliminado de favoritos`, "info");
        } else {
          const result = addFavorite(currentCountry);
          if (result.ok && !result.duplicate) {
            showToast(`${name} agregado a favoritos`, "success");
          } else if (result.duplicate) {
            showToast("El destino ya está en favoritos", "info");
          } else {
            showToast("No se pudo guardar el favorito", "error");
          }
        }
        updateFavoriteUI();
        isSaving = false;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Errores
     ---------------------------------------------------------------------- */
  function showError(message) {
    loadingPanel.style.display = "none";
    errorPanel.style.display = "block";
    errorText.textContent = message;
  }

  /* ----------------------------------------------------------------------
     Arranque
     ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    setupFavoriteButtons();

    if (!code) {
      showError("No se especificó ningún destino. Vuelve a explorar y selecciona un país.");
      return;
    }
    loadCountry(code);
  });
})();