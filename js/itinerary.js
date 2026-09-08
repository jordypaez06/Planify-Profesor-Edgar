/* ==========================================================================
   PLANIFY - Página "Mi itinerario"
   - Formulario con validación completa (campos, fechas, viajeros, presupuesto)
   - Guardado en localStorage
   - Listado de viajes con estado (próximo / en curso / pasado)
   - Eliminación de viajes
   - Sugerencias de destino basadas en tus favoritos
   ========================================================================== */

"use strict";

(function () {
  injectNavbar("../", 3);
  injectFooter("../");

  const form = document.getElementById("tripForm");
  const tripsList = document.getElementById("tripsList");
  const emptyState = document.getElementById("emptyState");
  const messageArea = document.getElementById("messageArea");

  document.addEventListener("DOMContentLoaded", () => {
    setupDestinationSuggestions();
    setupFormValidation();
    renderTrips();
  });

  /* ----------------------------------------------------------------------
     Sugerencias de destino (datalist) a partir de favoritos
     ---------------------------------------------------------------------- */
  function setupDestinationSuggestions() {
    const datalist = document.getElementById("destinationSuggestions");
    const favorites = getFavorites();
    datalist.innerHTML = favorites
      .map((f) => `<option value="${escapeAttr(f.name)}"></option>`)
      .join("");
  }

  /* ----------------------------------------------------------------------
     Validación
     ---------------------------------------------------------------------- */
  function setupFormValidation() {
    // Limpiar el error de un campo cuando el usuario vuelve a escribir/cambiar
    form.querySelectorAll("[data-field]").forEach((group) => {
      const input = group.querySelector("input, textarea");
      if (!input) return;
      const onInput = () => clearFieldError(group);
      input.addEventListener("input", onInput);
      input.addEventListener("change", onInput);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const validation = validateForm();

      if (!validation.ok) {
        showMessage("message-error", validation.errors.length + " campo(s) requieren atención.",
          validation.errors.join(". "));
        return;
      }

      handleSubmit(validation.data);
    });
  }

  function validateForm() {
    const name = document.getElementById("tripName").value.trim();
    const destination = document.getElementById("tripDestination").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const travelersRaw = document.getElementById("travelers").value.trim();
    const budgetRaw = document.getElementById("budget").value.trim();
    const comments = document.getElementById("comments").value.trim();

    const errors = [];
    let ok = true;

    // Nombre obligatorio
    if (!name) {
      markInvalid("name"); errors.push("Nombre del viaje"); ok = false;
    } else {
      markValid("name");
    }

    // Destino obligatorio
    if (!destination) {
      markInvalid("destination"); errors.push("Destino"); ok = false;
    } else {
      markValid("destination");
    }

    // Fechas obligatorias y lógicas
    if (!startDate) {
      markInvalid("startDate"); errors.push("Fecha de inicio"); ok = false;
    } else {
      markValid("startDate");
    }

    if (!endDate) {
      markInvalid("endDate"); errors.push("Fecha de finalización"); ok = false;
    } else if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      markInvalid("endDate"); errors.push("La fecha final debe ser posterior a la inicial"); ok = false;
    } else if (startDate) {
      markValid("endDate");
    }

    // Viajeros: 1 a 99
    const travelers = Number(travelersRaw);
    if (!travelersRaw) {
      markInvalid("travelers"); errors.push("Número de viajeros"); ok = false;
    } else if (!Number.isInteger(travelers) || travelers < 1 || travelers > 99) {
      markInvalid("travelers"); errors.push("Viajeros entre 1 y 99"); ok = false;
    } else {
      markValid("travelers");
    }

    // Presupuesto opcional pero no negativo
    let budget = null;
    if (budgetRaw !== "") {
      budget = Number(budgetRaw);
      if (isNaN(budget) || budget < 0) {
        markInvalid("budget"); errors.push("Presupuesto no negativo"); ok = false;
      } else {
        markValid("budget");
      }
    }

    // Comentarios: sin validación, opcional

    const data = ok
      ? {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name,
          destination,
          startDate,
          endDate,
          travelers,
          budget,
          comments,
          createdAt: new Date().toISOString(),
        }
      : null;

    return { ok, errors, data };
  }

  function markInvalid(fieldName) {
    const group = form.querySelector(`[data-field="${fieldName}"]`);
    if (group) group.classList.add("invalid");
  }

  function markValid(fieldName) {
    const group = form.querySelector(`[data-field="${fieldName}"]`);
    if (group) group.classList.remove("invalid");
  }

  function clearFieldError(group) {
    group.classList.remove("invalid");
  }

  /* ----------------------------------------------------------------------
     Envío
     ---------------------------------------------------------------------- */
  function handleSubmit(trip) {
    addTrip(trip);
    showMessage("message-success", "¡Viaje creado correctamente!", "");
    showToast("Itinerario guardado", "success");
    form.reset();
    form.querySelectorAll("[data-field]").forEach((g) => g.classList.remove("invalid"));
    renderTrips();
    setupDestinationSuggestions();
  }

  /* ----------------------------------------------------------------------
     Listado de viajes
     ---------------------------------------------------------------------- */
  function computeTripStatus(trip) {
    const today = new Date();
    const start = new Date(trip.startDate + "T00:00:00");
    const end = new Date(trip.endDate + "T00:00:00");

    today.setHours(0, 0, 0, 0);

    if (end < today) return { label: "Pasado", cls: "past" };
    if (start <= today && end >= today) return { label: "En curso", cls: "ongoing" };
    return { label: "Próximo", cls: "upcoming" };
  }

  function renderTrips() {
    const trips = getTrips();
    emptyState.style.display = trips.length === 0 ? "block" : "none";
    tripsList.innerHTML = "";

    // Ordenar: los que inician primero aparecen arriba
    const sorted = [...trips].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    sorted.forEach((trip) => {
      tripsList.appendChild(tripCard(trip));
    });

    if (trips.length > 0) {
      tripsList.querySelectorAll(".btn-danger").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          deleteTrip(id);
          showToast("Viaje eliminado", "info");
          renderTrips();
        });
      });
    }
  }

  function tripCard(trip) {
    const status = computeTripStatus(trip);
    const budget = trip.budget !== null && trip.budget !== undefined
      ? `$${formatNumber(trip.budget)} USD`
      : "Sin definir";

    const card = document.createElement("article");
    card.className = "trip-card";
    card.innerHTML = `
      <div class="trip-card-header">
        <h3><i class="bi bi-airplane"></i> ${escapeHtml(trip.name)}</h3>
        <span class="trip-status ${status.cls}">${status.label}</span>
      </div>
      <div class="trip-info">
        <div class="ti-item"><i class="bi bi-geo-alt"></i> ${escapeHtml(trip.destination)}</div>
        <div class="ti-item"><i class="bi bi-calendar-range"></i> ${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}</div>
        <div class="ti-item"><i class="bi bi-people"></i> ${trip.travelers} ${trip.travelers === 1 ? "viajero" : "viajeros"}</div>
        <div class="ti-item"><i class="bi bi-wallet2"></i> ${budget}</div>
      </div>
      ${trip.comments ? `<div class="trip-comments"><i class="bi bi-chat-square-text"></i> ${escapeHtml(trip.comments)}</div>` : ""}
      <div class="trip-actions">
        <button class="btn btn-danger btn-small" data-id="${trip.id}">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </div>
    `;
    return card;
  }

  /* ----------------------------------------------------------------------
     Mensajes
     ---------------------------------------------------------------------- */
  function showMessage(type, title, detail) {
    messageArea.innerHTML = `
      <div class="message ${type}">
        <span class="msg-icon"><i class="bi ${
          type === "message-success" ? "bi-check-circle" : "bi-exclamation-circle"
        }"></i></span>
        <span><strong>${escapeHtml(title)}</strong>${detail ? ` ${escapeHtml(detail)}` : ""}</span>
      </div>`;
    // El mensaje desaparece solo después de unos segundos
    setTimeout(() => {
      messageArea.innerHTML = "";
    }, 4000);
  }

  /* ----------------------------------------------------------------------
     Utilidades de saneado
     ---------------------------------------------------------------------- */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();