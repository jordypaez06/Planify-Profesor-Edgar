/* ==========================================================================
   PLANIFY - utilidades compartidas
   - Inyección de navbar y footer en todas las páginas
   - Helpers para localStorage (favoritos e itinerarios)
   - Toasts y mensajes de retroalimentación
   - Utilidades de formato (números, fechas, monedas)
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   1. NAVEGACIÓN COMPARTIDA
   -------------------------------------------------------------------------- */

const PAGES = [
  { href: "index.html", label: "Inicio", icon: "bi-house-door" },
  { href: "pages/explore.html", label: "Explorar", icon: "bi-compass" },
  { href: "pages/favorites.html", label: "Favoritos", icon: "bi-heart" },
  { href: "pages/itinerary.html", label: "Mi Itinerario", icon: "bi-calendar3" },
];

// Inserta el navbar indicando cuál página está activa.
// active: índice de la página activa (ruta base para enlaces)
function injectNavbar(basePath, activeIndex) {
  const navbar = document.querySelector("#navbar");
  if (!navbar) return;

  const links = PAGES.map(
    (p, i) =>
      `<a href="${basePath}${p.href}" class="${i === activeIndex ? "active" : ""}">
         <i class="bi ${p.icon}"></i>
         ${p.label}
       </a>`
  ).join("");

  navbar.innerHTML = `
    <div class="nav-inner container">
      <a href="${basePath}index.html" class="brand">
        <span class="logo-icon" aria-hidden="true">✈️</span>
        <span>Planify</span>
      </a>
      <nav class="nav-links" id="navLinks">
        ${links}
      </nav>
      <span class="brand" aria-label="Usuario" title="Jordy Paez"><span>Jordy Paez</span></span>
      <button class="nav-toggle" id="navToggle" aria-label="Abrir menú">
        <i class="bi bi-list"></i>
      </button>
    </div>
  `;

  // Menú hamburguesa (móvil)
  const toggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    const icon = toggle.querySelector("i");
    icon.className = navLinks.classList.contains("open") ? "bi bi-x-lg" : "bi bi-list";
  });

  // Cerrar el menú al hacer click en un enlace
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}

// Inserta el footer. basePath: "../" para páginas en /pages, "" para la raíz
function injectFooter(basePath = "") {
  const footer = document.querySelector("#footer");
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="${basePath}index.html" class="brand">
            <span class="logo-icon" aria-hidden="true">✈️</span>
            Planify
          </a>
          <p>Explora el mundo, planifica tu viaje perfecto y mantén tu itinerario organizado, todo en un solo lugar.</p>
        </div>
        <div>
          <h4>Navegación</h4>
          <ul class="footer-links">
            <li><a href="${basePath}index.html">Inicio</a></li>
            <li><a href="${basePath}pages/explore.html">Explorar destinos</a></li>
            <li><a href="${basePath}pages/favorites.html">Favoritos</a></li>
            <li><a href="${basePath}pages/itinerary.html">Mi itinerario</a></li>
          </ul>
        </div>
        <div>
          <h4>Recursos</h4>
          <ul class="footer-links">
            <li><a href="https://restcountries.com" target="_blank" rel="noopener">REST Countries API</a></li>
            <li><a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo API</a></li>
            <li><a href="https://icons.getbootstrap.com" target="_blank" rel="noopener">Bootstrap Icons</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Planify · Proyecto Universitario con fines académicos.</p>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   2. HELPERS PARA FAVORITOS (localStorage)
   -------------------------------------------------------------------------- */

const FAVORITES_KEY = "planify:favorites";

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error al leer favoritos:", e);
    return [];
  }
}

// Devuelve true si el país ya está guardado
function isFavorite(countryCode) {
  return getFavorites().some((c) => c.cca3 === countryCode);
}

// Guarda un país en favoritos (evita duplicados por código cca3)
function addFavorite(country) {
  const favorites = getFavorites();

  if (favorites.some((c) => c.cca3 === country.cca3)) {
    return { ok: false, duplicate: true };
  }

  // Solo guardamos los datos imprescindibles para reusar en las tarjetas
  favorites.push({
    cca3: country.cca3,
    name: country.name.common,
    capital: country.capital && country.capital[0] ? country.capital[0] : "Sin información",
    region: country.region,
    subregion: country.subregion || "",
    population: country.population,
    flag: country.flags.svg,
    latlng: country.latlng,
    languages: country.languages,
    currencies: country.currencies,
  });

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return { ok: true };
  } catch (e) {
    console.error("Error al guardar favoritos:", e);
    return { ok: false, error: e };
  }
}

function removeFavorite(countryCode) {
  const favorites = getFavorites().filter((c) => c.cca3 !== countryCode);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/* --------------------------------------------------------------------------
   3. HELPERS PARA ITINERARIOS (localStorage)
   -------------------------------------------------------------------------- */

const TRIPS_KEY = "planify:trips";

function getTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error al leer itinerarios:", e);
    return [];
  }
}

function saveTrips(trips) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

function addTrip(trip) {
  const trips = getTrips();
  trips.push(trip);
  saveTrips(trips);
  return trip;
}

function deleteTrip(tripId) {
  saveTrips(getTrips().filter((t) => t.id !== tripId));
}

/* --------------------------------------------------------------------------
   4. TOASTS Y RETROALIMENTACIÓN
   -------------------------------------------------------------------------- */

// Muestra una notificación efímera. tipos: success | error | info
function showToast(message, type = "info") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  const icons = { success: "bi-check-circle", error: "bi-exclamation-triangle", info: "bi-info-circle" };
  toast.className = `toast toast-${type} show`;
  toast.innerHTML = `<i class="bi ${icons[type]}"></i><span>${message}</span>`;

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* --------------------------------------------------------------------------
   5. UTILIDADES DE FORMATO
   -------------------------------------------------------------------------- */

// 14593789 -> "14,593,789"
function formatNumber(n) {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("es-ES");
}

// Convierte una fecha ISO a texto legible: "12 ene 2026"
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// Primer día de una lista de idiomas: {spa:"Spanish"} -> "Spanish"
function firstLanguage(languages) {
  if (!languages) return "Sin información";
  const keys = Object.keys(languages);
  return keys.length ? languages[keys[0]] : "Sin información";
}

// Monedas: {COP:{name.., symbol..}} -> [{name, symbol}]
function currencyList(currencies) {
  if (!currencies) return [];
  return Object.values(currencies)
    .map((c) => (c.name ? `${c.name} (${c.symbol || ""})`.trim() : c.symbol || ""))
    .filter((v) => v);
}
/* --------------------------------------------------------------------------
   3.5 LOCALIZACION AL ESPANOL (textos visibles)
   REST Countries v5 expone nombres oficiales, regiones, idiomas, monedas y
   lado de conduccion en ingles. Estas tablas traducen al espanol los valores
   mostrados al usuario. Si un valor no esta en las tablas se conserva el
   valor original (nunca una traduccion incorrecta).
   -------------------------------------------------------------------------- */

const ES_REGIONS = {
  "Africa": "\u00C1frica",
  "Americas": "Am\u00E9rica",
  "Asia": "Asia",
  "Europe": "Europa",
  "Oceania": "Ocean\u00EDa",
  "Antarctica": "Ant\u00E1rtida",
};

const ES_SUBREGIONS = {
  "Caribbean": "Caribe",
  "Central America": "Am\u00E9rica Central",
  "Northern America": "Am\u00E9rica del Norte",
  "South America": "Am\u00E9rica del Sur",
  "Eastern Africa": "\u00C1frica Oriental",
  "Middle Africa": "\u00C1frica Central",
  "Northern Africa": "\u00C1frica del Norte",
  "Southern Africa": "\u00C1frica Meridional",
  "Western Africa": "\u00C1frica Occidental",
  "Central Asia": "Asia Central",
  "Eastern Asia": "Asia Oriental",
  "South-Eastern Asia": "Sudeste Asi\u00E1tico",
  "Southeast Europe": "Europa Sudoriental",
  "Central Europe": "Europa Central",
  "Southern Asia": "Asia Meridional",
  "Western Asia": "Asia Occidental",
  "Eastern Europe": "Europa Oriental",
  "Northern Europe": "Europa del Norte",
  "Southern Europe": "Europa del Sur",
  "Western Europe": "Europa Occidental",
  "Australia and New Zealand": "Australia y Nueva Zelanda",
  "Melanesia": "Melanesia",
  "Micronesia": "Micronesia",
  "Polynesia": "Polinesia",
};

const ES_DRIVING = {
  "right": "derecha",
  "left": "izquierda",
};

const ES_LANGUAGES = {
  "en": "Ingl\u00E9s", "es": "Espa\u00F1ol", "pt": "Portugu\u00E9s", "fr": "Franc\u00E9s",
  "de": "Alem\u00E1n", "it": "Italiano", "ru": "Ruso", "uk": "Ucraniano",
  "pl": "Polaco", "cs": "Checo", "sk": "Eslovaco", "hu": "H\u00FAngaro",
  "ro": "Rumano", "bg": "B\u00FAlgaro", "sr": "Serbio", "hr": "Croata",
  "sl": "Esloveno", "bs": "Bosnio", "mk": "Macedonio", "el": "Griego",
  "tr": "Turco", "nl": "Neerland\u00E9s", "sv": "Sueco", "no": "Noruego",
  "da": "Dan\u00E9s", "fi": "Fin\u00E9s", "is": "Island\u00E9s", "et": "Estonio",
  "lv": "Let\u00F3n", "lt": "Lituano", "ga": "Irland\u00E9s", "sq": "Alban\u00E9s",
  "mt": "Malt\u00E9s", "ar": "\u00C1rabe", "he": "Hebreo", "fa": "Persa",
  "ur": "Urdu", "hi": "Hindi", "bn": "Bengal\u00ED", "pa": "Panyab\u00ED",
  "ta": "Tamil", "te": "Telugu", "mr": "Marat\u00ED", "gu": "Guyarat\u00ED",
  "kn": "Canar\u00E9s", "ml": "Malayalam", "si": "Cingal\u00E9s", "ne": "Nepal\u00ED",
  "km": "Jemer", "lo": "Lao", "th": "Tailand\u00E9s", "vi": "Vietnamita",
  "my": "Birmano", "id": "Indonesio", "ms": "Malayo", "tl": "Tagalo",
  "zh": "Chino", "ja": "Japon\u00E9s", "ko": "Coreano", "mn": "Mongol",
  "ka": "Georgiano", "hy": "Armenio", "az": "Azer\u00ED", "kk": "Kazajo",
  "uz": "Uzbeko", "ky": "Kirgu\u00EDs", "tg": "Tayiko", "tk": "Turcomano",
  "be": "Bielorruso", "am": "Am\u00E1rico", "sw": "Suajili", "yo": "Yoruba",
  "ig": "Igbo", "ha": "Hausa", "zu": "Zul\u00FA", "af": "Afrik\u00E1ans",
  "so": "Somal\u00ED", "ti": "Tigri\u00F1a", "om": "Oromo", "sn": "Shona",
  "ny": "Chichewa", "mg": "Malgache", "rw": "Kinyarwanda", "ln": "Lingala",
  "wo": "W\u00F3lof", "xh": "Xhosa", "st": "Sesoto", "tn": "Setsuana",
  "ts": "Tsonga", "ceb": "Cebuano", "ab": "Abjasio", "ca": "Catal\u00E1n",
  "eu": "Euskera", "gl": "Gallego", "ay": "Aimara", "qu": "Quechua",
  "gn": "Guaran\u00ED", "ht": "Criollo haitiano", "sm": "Samoano",
  "to": "Tongano", "fj": "Fiyiano", "nrm": "Normando", "mfe": "Criollo mauriciano",
  "dv": "Divehi", "prs": "Dari", "pus": "Pashto",
  "ckb": "Soran\u00ED", "ber": "Amazig", "cmn": "Chino (mandar\u00EDn)",
  "fil": "Filipino", "gla": "Ga\u00E9lico escoc\u00E9s", "cym": "Gal\u00E9s",
  "bis": "Bislama",
  "spa": "Espa\u00F1ol", "eng": "Ingl\u00E9s", "por": "Portugu\u00E9s", "fra": "Franc\u00E9s",
  "deu": "Alem\u00E1n", "ita": "Italiano", "rus": "Ruso", "ukr": "Ucraniano",
  "pol": "Polaco", "ces": "Checo", "slk": "Eslovaco", "hun": "H\u00FAngaro",
  "ron": "Rumano", "bul": "B\u00FAlgaro", "srp": "Serbio", "hrv": "Croata",
  "slv": "Esloveno", "bos": "Bosnio", "mkd": "Macedonio", "ell": "Griego",
  "tur": "Turco", "nld": "Neerland\u00E9s", "swe": "Sueco", "nor": "Noruego",
  "dan": "Dan\u00E9s", "fin": "Fin\u00E9s", "isl": "Island\u00E9s", "est": "Estonio",
  "lav": "Let\u00F3n", "lit": "Lituano", "gle": "Irland\u00E9s", "sqi": "Alban\u00E9s",
  "mlt": "Malt\u00E9s", "ara": "\u00C1rabe", "heb": "Hebreo", "fas": "Persa",
  "urd": "Urdu", "hin": "Hindi", "ben": "Bengal\u00ED", "pan": "Panyab\u00ED",
  "tam": "Tamil", "tel": "Telugu", "mar": "Marat\u00ED", "guj": "Guyarat\u00ED",
  "kan": "Canar\u00E9s", "mal": "Malayalam", "sin": "Cingal\u00E9s", "nep": "Nepal\u00ED",
  "khm": "Jemer", "lao": "Lao", "tha": "Tailand\u00E9s", "vie": "Vietnamita",
  "mya": "Birmano", "ind": "Indonesio", "msa": "Malayo", "tgl": "Tagalo",
  "zho": "Chino", "jpn": "Japon\u00E9s", "kor": "Coreano", "mon": "Mongol",
  "kat": "Georgiano", "hye": "Armenio", "aze": "Azer\u00ED", "kaz": "Kazajo",
  "uzb": "Uzbeko", "kir": "Kirgu\u00EDs", "tgk": "Tayiko", "tuk": "Turcomano",
  "bel": "Bielorruso", "amh": "Am\u00E1rico", "swa": "Suajili", "yor": "Yoruba",
  "ibo": "Igbo", "hau": "Hausa", "zul": "Zul\u00FA", "afr": "Afrik\u00E1ans",
  "som": "Somal\u00ED", "abk": "Abjasio",
};

const ES_CURRENCIES = {
  "COP": "Peso colombiano", "USD": "D\u00F3lar estadounidense", "EUR": "Euro",
  "GBP": "Libra esterlina", "ARS": "Peso argentino", "MXN": "Peso mexicano",
  "BRL": "Real brasile\u00F1o", "CLP": "Peso chileno", "PEN": "Sol peruano",
  "BOB": "Boliviano", "UYU": "Peso uruguayo", "PYG": "Guaran\u00ED paraguayo",
  "VES": "Bol\u00EDvar venezolano", "CAD": "D\u00F3lar canadiense",
  "AUD": "D\u00F3lar australiano", "NZD": "D\u00F3lar neozeland\u00E9s",
  "JPY": "Yen japon\u00E9s", "CNY": "Yuan chino", "KRW": "Won surcoreano",
  "INR": "Rupia india", "PKR": "Rupia pakistan\u00ED", "BDT": "Taka banglades\u00ED",
  "SAR": "Riyal saud\u00ED", "AED": "D\u00EDrham de los EAU", "QAR": "Riyal catar\u00ED",
  "KWD": "Dinar kuwait\u00ED", "OMR": "Rial oman\u00ED", "JOD": "Dinar jordano",
  "ILS": "Nuevo sh\u00E9quel israel\u00ED", "TRY": "Lira turca", "RUB": "Rublo ruso",
  "UAH": "Grivna ucraniana", "BYN": "Rublo bielorruso", "PLN": "Zloti polaco",
  "CZK": "Corona checa", "HUF": "Flor\u00EDn h\u00FAngaro", "RON": "Leu rumano",
  "BGN": "Lev b\u00FAlgaro", "RSD": "Dinar serbio", "MKD": "Denar macedonio",
  "ALL": "Lek alban\u00E9s", "BAM": "Marco convertible", "GEL": "Lari georgiano",
  "AMD": "Dram armenio", "AZN": "Manat azerbaiyano", "KZT": "Tenge kazajo",
  "KGS": "Som kirgu\u00EDs", "TJS": "Somoni tayiko", "TMT": "Manat turcomano",
  "UZS": "Som uzbeko", "MNT": "Tugrik mongol", "THB": "Baht tailand\u00E9s",
  "VND": "Dong vietnamita", "IDR": "Rupia indonesia", "MYR": "Ringgit malayo",
  "PHP": "Peso filipino", "SGD": "D\u00F3lar de Singapur", "HKD": "D\u00F3lar de Hong Kong",
  "CHF": "Franco suizo", "SEK": "Corona sueca", "NOK": "Corona noruega",
  "DKK": "Corona danesa", "ISK": "Corona islandesa", "NGN": "Naira nigeriana",
  "EGP": "Libra egipcia", "MAD": "D\u00EDrham marroqu\u00ED", "DZD": "Dinar argelino",
  "TND": "Dinar tunecino", "LYD": "Dinar libio", "ETB": "Birr et\u00EDope",
  "KES": "Chel\u00EDn keniano", "TZS": "Chel\u00EDn tanzano", "UGX": "Chel\u00EDn ugand\u00E9s",
  "GHS": "Cedi ghan\u00E9s", "ZAR": "Rand sudafricano", "XOF": "Franco CFA de \u00C1frica Occidental",
  "XAF": "Franco CFA de \u00C1frica Central", "RWF": "Franco ruand\u00E9s",
  "MUR": "Rupia mauriciana", "MGA": "Ariary malgache", "FJD": "D\u00F3lar fiyiano",
  "PGK": "Kina de Pap\u00FAa Nueva Guinea", "VUV": "Vatu vanuatuano",
  "CVE": "Escudo caboverdiano", "PAB": "Balboa paname\u00F1o",
  "CRC": "Col\u00F3n costarricense", "GTQ": "Quetzal guatemalteco",
  "HNL": "Lempira hondure\u00F1o", "NIO": "C\u00F3rdoba nicarag\u00FCense",
  "DOP": "Peso dominicano", "CUP": "Peso cubano", "HTG": "Gourde haitiano",
};

const ES_CAPITALS = {
  "Beijing": "Pek\u00EDn", "Moscow": "Mosc\u00FA", "London": "Londres",
  "Paris": "Par\u00EDs", "Vienna": "Viena", "Rome": "Roma",
  "Berlin": "Berl\u00EDn", "Bern": "Berna", "Amsterdam": "\u00C1msterdam",
  "Brussels": "Bruselas", "Copenhagen": "Copenhague", "Stockholm": "Estocolmo",
  "Oslo": "Oslo", "Helsinki": "Helsinki", "Athens": "Atenas",
  "Lisbon": "Lisboa", "Dublin": "Dubl\u00EDn", "Prague": "Praga",
  "Budapest": "Budapest", "Bucharest": "Bucarest", "Warsaw": "Varsovia",
  "Kiev": "Kiev", "Sofia": "Sof\u00EDa", "Belgrade": "Belgrado",
  "Ankara": "Ankara", "Cairo": "El Cairo", "Tokyo": "Tokio",
  "Seoul": "Se\u00FAl", "New Delhi": "Nueva Delhi", "Jakarta": "Yakarta",
  "Hanoi": "Han\u00F3i", "Phnom Penh": "Nom Pen", "Vientiane": "Vienti\u00E1n",
  "Bangkok": "Bangkok", "Baghdad": "Bagdad", "Tehran": "Teher\u00E1n",
  "Riyadh": "Riad", "Abu Dhabi": "Abu Dabi", "Muscat": "Mascate",
  "Amman": "Am\u00E1n", "Damascus": "Damasco", "Beirut": "Beirut",
  "Jerusalem": "Jerusal\u00E9n", "Tbilisi": "Tiflis", "Yerevan": "Erev\u00E1n",
  "Baku": "Bak\u00FA", "Astana": "Astan\u00E1", "Bishkek": "Biskek",
  "Dushanbe": "Dusamb\u00E9", "Ashgabat": "Asjabad", "Tashkent": "Taskent",
  "Ulaanbaatar": "Ul\u00E1n Bator", "Washington, D.C.": "Washington D. C.",
  "Ottawa": "Ottawa", "Mexico City": "Ciudad de M\u00E9xico",
  "Bras\u00EDlia": "Brasilia",
  "Port-au-Prince": "Puerto Pr\u00EDncipe", "Panama City": "Ciudad de Panam\u00E1",
  "Havana": "La Habana", "Port Moresby": "Puerto Moresby",
  "Khartoum": "Jartum", "Kinshasa": "Kinsasa", "Djibouti": "Yibuti",
  "Mogadishu": "Mogadiscio", "Juba": "Yuba", "Ouagadougou": "Uagadug\u00FA",
  "Nouakchott": "Nuakchot", "Abidjan": "Abiy\u00E1n", "Yamoussoukro": "Yamusukro",
  "Cotonou": "Coton\u00FA", "Addis Ababa": "Ad\u00EDs Abeba", "Tripoli": "Tr\u00EDpoli",
  "Tunis": "T\u00FAnez", "Algiers": "Argel", "Lom\u00E9": "Lom\u00E9",
};

function esValue(value, map) {
  if (value === undefined || value === null) return "";
  return map[value] || value;
}

function esRegion(v) { return esValue(v, ES_REGIONS); }
function esSubregion(v) { return esValue(v, ES_SUBREGIONS); }
function esDrivingSide(side) { return esValue(side, ES_DRIVING); }
function esCapital(city) { return esValue(city, ES_CAPITALS); }
function esLanguage(code, fallbackName) { return ES_LANGUAGES[code] || fallbackName || ""; }
function esCurrencyName(code, fallbackName) { return ES_CURRENCIES[code] || fallbackName || ""; }

let esNamesPromise = null;

// Nombres y capitales en espanol tomados del catalogo local, que es mas
// completo que las traducciones genericas. Reutiliza el dataset ya cacheado.
async function loadEsNames() {
  if (esNamesPromise) return esNamesPromise;
  esNamesPromise = (async function () {
    const map = Object.create(null);
    try {
      const data = await loadLocalCountries();
      data.forEach(function (c) {
        if (c && c.cca3) {
          map[c.cca3] = {
            common: c.name && c.name.common,
            official: c.name && c.name.official,
            capital: c.capital && c.capital[0] ? c.capital[0] : "",
          };
        }
      });
    } catch (e) {
      // Sin catalogo local -> se conservan los valores originales.
    }
    return map;
  })();
  return esNamesPromise;
}

// Devuelve una copia del pais con los textos visibles en espanol.
// Si no hay traduccion disponible se conserva el valor original.
async function esLocalizeCountry(country) {
  if (!country) return country;
  const names = await loadEsNames();
  const n = names[country.cca3] || {};

  const out = Object.assign({}, country);
  if (country.name) {
    out.name = {
      common: country.name.common,
      official: country.name.official,
    };
    if (n.common) out.name.common = n.common;
    if (n.official) out.name.official = n.official;
  }
  out.subregion = esSubregion(country.subregion);
  out.region = esRegion(country.region);

  if (country.car && country.car.side) {
    out.car = Object.assign({}, country.car, { side: esDrivingSide(country.car.side) });
  }

  const capRaw = Array.isArray(country.capital)
    ? country.capital[0]
    : typeof country.capital === "string" ? country.capital : "";
  const cap = capRaw ? String(capRaw) : "";
  if (cap) {
    const es = n.capital || esCapital(cap);
    out.capital = es ? [es] : country.capital;
  }

  if (country.languages) {
    out.languages = {};
    Object.keys(country.languages).forEach(function (code) {
      out.languages[code] = esLanguage(code, country.languages[code]);
    });
  }

  const normCur = normalizeCurrencies(country.currencies);
  if (normCur && Object.keys(normCur).length) {
    out.currencies = {};
    Object.keys(normCur).forEach(function (code) {
      const cur = normCur[code] || {};
      out.currencies[code] = Object.assign({}, cur, { name: esCurrencyName(code, cur.name) });
    });
  } else {
    out.currencies = {};
  }

  return out;
}


// Construye una tarjeta de país (usada por las páginas relevantes)
// country: objeto de REST Countries  ·  detailBase: ruta base hacia detail.html
// Si una bandera no carga (CDN caido o pais sin bandera), reintenta con flagcdn.com y, si falla, muestra un placeholder.
// Bandera local para territorios sin codigo ISO estandar (ej. Abjasia).
// La URL raiz-relativa funciona desde cualquier pagina (raiz o /pages).
// Ruta raiz-relativa del proyecto (empieza con "/") -> ruta relativa valida desde
// la profundidad de la pagina actual (raiz o /pages/), para que funcione tambien
// publicada en GitHub Pages bajo /Planify-Profesor-Edgar/.
function localProjectUrl(p) {
  if (!p || p.charAt(0) !== "/") return p;
  const base2 = /\/pages\//.test(window.location.pathname) ? "../" : "";
  return base2 + p.substring(1);
}

function localFlagFor(img) {
  const src = (img.getAttribute("src") || "").toLowerCase();
  const base = (src.split("/").pop() || "").replace(/\.[a-z0-9]+$/, "");
  const alt = (img.getAttribute("alt") || "").toLowerCase();
  return /abkhazia|abjasia/.test(base + " " + alt) || base === "ab" || base === "abk"
    ? localProjectUrl("/data/flags/abkhazia.svg")
    : "";
}

function flagFallback(img) {
  if (img.dataset.tried) {
    img.outerHTML = '<div class="flag-skeleton">Sin imagen</div>';
    return;
  }
  img.dataset.tried = "1";
  const local = localFlagFor(img);
      if (local) { img.src = local; img.onerror = function () { flagFallback(img); }; return; }
      const m = (img.getAttribute("src") || "").match(/([A-Za-z0-9-]+)\.png$/);
  img.onerror = null;
  if (m) {
    img.src = "https://flagcdn.com/w320/" + m[1].toLowerCase() + ".png";
    img.onerror = function () { flagFallback(img); };
  } else {
    img.outerHTML = '<div class="flag-skeleton">Sin imagen</div>';
  }
}
function countryCardHTML(country, detailBase = "detail.html") {
  const cca3 = country.cca3 || country.cca2 || "desconocido";
  const saved = isFavorite(cca3);
  const detailHref = `${detailBase}?code=${cca3}`;

  return `
    <article class="card country-card" data-country-card>
      <div class="flag-wrap">
        <img src="${localProjectUrl(country.flags?.svg) || ""}"
             alt="Bandera de ${country.name?.common || cca3}"
             loading="lazy"
             onerror="flagFallback(this)">
        <button class="fav-toggle ${saved ? "saved" : ""}" data-fav="${cca3}" data-name="${country.name?.common || ""}"
                title="${saved ? "Quitar de favoritos" : "Agregar a favoritos"}">
          <i class="bi ${saved ? "bi-heart-fill" : "bi-heart"}"></i>
        </button>
      </div>
      <div class="card-body">
        <h3 class="country-name">${country.name?.common || "Sin nombre"}</h3>
        <p class="country-capital">
          <i class="bi bi-geo-alt"></i> ${Array.isArray(country.capital) && country.capital[0] ? country.capital[0] : "Sin capital"}
        </p>
        <div class="country-meta">
          <span><i class="bi bi-globe2"></i> ${country.region || "—"}</span>
          <span><i class="bi bi-people"></i> ${formatNumber(country.population)}</span>
        </div>
        <div class="card-actions">
          <a href="${detailHref}" class="btn btn-outline btn-small">Ver detalles</a>
        </div>
      </div>
    </article>
  `;
}

// Devuelve el clima (promise). Lógica compartida entre detail y home si hace falta.
async function fetchWeather(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
    "&timezone=auto&forecast_days=5";

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo obtener el clima");
  return res.json();
}

/* --------------------------------------------------------------------------
   6. REST COUNTRIES v5 (con API key gratuita)
   REST Countries descontinuó las versiones v1–v4 en 2026. La versión v5
   usa `api.restcountries.com/countries/v5`, requiere una clave API y
   exige registrar el hostname (ej. `localhost`) en las claves de la cuenta
   para permitir consultas desde un navegador (CORS).
   La autenticación oficial se envía en el header HTTP:
       Authorization: Bearer <clave_api>
   Aquí centralizamos peticiones, normalización y el panel de configuración.
   -------------------------------------------------------------------------- */

const RC_BASE = "https://api.restcountries.com/countries/v5";
const RC_FIELDS = [
  "names.common",
  "names.official",
  "codes.alpha_2",
  "codes.alpha_3",
  "capitals",
  "region",
  "subregion",
  "population",
  "coordinates",
  "area.kilometers",
  "languages",
  "currencies",
  "timezones",
  "cars.driving_side",
  "classification.sovereign",
].join(",");

// Clave opcional guardada solo por un desarrollador (localStorage, sin UI).
// Los visitantes no ven ni usan este valor: al estar vacío, Planify usa
// siempre el dataset local data/countries.json. No hay claves en el código.
const RC_KEY_STORAGE = "planify:rcApiKey";

function getRcKey() {
  try {
    return localStorage.getItem(RC_KEY_STORAGE) || "";
  } catch (e) {
    return "";
  }
}

// Error propio con tipo para distinguir problemas de clave / CORS / demo
class RCError extends Error {
  constructor(message, type = "server") {
    super(message);
    this.name = "RCError";
    this.type = type;
  }
}

// Sanea texto antes de insertarlo en HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text == null ? "" : text);
  return div.innerHTML;
}

// Ejecuta una petición válida a REST Countries v5 y devuelve data.objects
async function fetchRcObjects(path, params = {}) {
  const key = getRcKey();
  const url = new URL(RC_BASE + path);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));

  // Autenticación oficial de REST Countries v5: header Authorization: Bearer <clave>
  const headers = new Headers();
  if (key) headers.set("Authorization", "Bearer " + key);

  let res;
  try {
    res = await fetch(url.toString(), { headers: headers });
  } catch (e) {
    throw new RCError(
      key
        ? "El navegador bloqueó la conexión con REST Countries (CORS). Revisa que 'localhost' esté registrado en tus claves de restcountries.com."
        : "No hay conexión con REST Countries o falta tu clave API.",
      key ? "cors" : "network"
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new RCError(
      "REST Countries rechazó la clave (código " + res.status + "). Revisa la clave y que 'localhost' esté permitido en tus claves.",
      "auth"
    );
  }
  if (res.status === 404) {
    throw new Error("País no encontrado");
  }
  if (!res.ok) {
    throw new RCError("REST Countries respondió con un error (código " + res.status + ").", "server");
  }

  const json = await res.json();

  // Respuestas de error del servicio (p. ej. versiones deprecadas)
  if (json.errors && !json.data) {
    const msg = (json.errors[0] && json.errors[0].message) || "Error desconocido de la API.";
    throw new RCError(msg, "server");
  }

  // Clave demo: solo devuelve un país de muestra, no todos los destinos
  if (json.data && json.data._demo) {
    throw new RCError(
      "Estás usando la clave demo de REST Countries, que solo devuelve un destino de muestra. Agrega tu clave gratuita para cargar todos los países.",
      "demo"
    );
  }

  const objects = json.data && json.data.objects;
  if (!Array.isArray(objects)) {
    throw new RCError("La respuesta de REST Countries no tiene el formato esperado.", "server");
  }
  return objects;
}

// Convierte un país de v5 al formato que usa Planify (similar al de v3)

// Normaliza `currencies` de REST Countries al formato {CODIGO:{name,symbol}}.
// La API v5 entrega un ARRAY de {code,name,symbol}; se aceptan tambien el
// formato v3 indexado por codigo ISO ({COD:{name,symbol}}) y el objeto simple
// ({code,name,symbol}) por si alguna respuesta trae una sola moneda.
function normalizeCurrencies(v) {
  const out = {};
  if (!v) return out;
  const items = Array.isArray(v)
    ? v
    : v.code !== undefined || v.name !== undefined
      ? [v]
      : typeof v === "object"
        ? Object.keys(v).map(function (code) {
            return { code: code, name: v[code] && v[code].name, symbol: v[code] && v[code].symbol };
          })
        : [];
  items.forEach(function (it) {
    if (!it) return;
    const code = it.code;
    if (code) out[code] = { name: it.name, symbol: it.symbol };
    else if (it.name) out["_"] = { name: it.name, symbol: it.symbol };
  });
  return out;
}

function normalizeCountryV5(v) {
  const codes = v.codes || {};
  const a2 = (codes.alpha_2 || "").toLowerCase();
  const caps = Array.isArray(v.capitals) ? v.capitals.map((c) => c.name).filter(Boolean) : [];

  const languages = {};
  if (Array.isArray(v.languages)) {
    v.languages.forEach((l) => {
      const langCode = l.iso639_1 || l.iso_code;
      if (langCode && l.name) languages[langCode] = l.name;
    });
  }

  const currencies = normalizeCurrencies(v.currencies);

  return {
    cca3: codes.alpha_3 || codes.alpha_2 || "",
    cca2: codes.alpha_2 || "",
    name: {
      common: (v.names && v.names.common) || "",
      official: (v.names && v.names.official) || "",
    },
    capital: caps,
    region: v.region || "",
    subregion: v.subregion || "",
    population: v.population || 0,
    area: v.area && v.area.kilometers,
    flags: { svg: "https://flags.restcountries.com/v5/w320/" + a2 + ".png", png: "" },
    latlng:
      v.coordinates && v.coordinates.lat !== undefined
        ? [v.coordinates.lat, v.coordinates.lng]
        : v.capitals && v.capitals[0] && v.capitals[0].coordinates
          ? [v.capitals[0].coordinates.lat, v.capitals[0].coordinates.lng]
          : null,
    languages,
    currencies,
    timezones: v.timezones || [],
    car: { side: (v.cars && v.cars.driving_side) || "" },
    independent: (v.classification && v.classification.sovereign) || false,
  };
}

// Trae todos los países paginando de 100 en 100 (máximo del plan gratuito)
async function fetchAllCountriesV5() {
  const limit = 100;
  const all = [];
  let offset = 0;
  let more = true;

  while (more && offset < 300) {
    const objs = await fetchRcObjects("", {
      limit: limit,
      offset: offset,
      response_fields: RC_FIELDS,
    });
    all.push(...objs);
    more = objs.length === limit;
    offset += limit;
  }

  return all.map(normalizeCountryV5);
}

// Trae un país por su código ISO alpha-3 (ej. "COL")
async function fetchCountryV5(code) {
  const objs = await fetchRcObjects("/codes.alpha_3/" + encodeURIComponent(code), {
    response_fields: RC_FIELDS,
  });
  if (!objs.length) {
    const err = new Error("País no encontrado");
    throw err;
  }
  return normalizeCountryV5(objs[0]);
}

/* --------------------------------------------------------------------------
   7. FUENTE DE DATOS LOCAL (countries.json)
   Planify funciona de forma autónoma con un dataset local (data/countries.json)
   en el MISMO formato que produce normalizeCountryV5. La página no requiere
   que el visitante configure ninguna API.
   REST Countries (v5) solo se usa como fuente externa opcional si el
   desarrollador guardó una clave en localStorage (planify:rcApiKey); si esa
   consulta falla o no hay clave, se usa siempre el dataset local.
   -------------------------------------------------------------------------- */

let localCountriesCache = null;

// Ruta del dataset local: las páginas bajo /pages/ están un nivel más adentro
function countriesDataUrl() {
  return /\/pages\//.test(window.location.pathname)
    ? "../data/countries.json?v=20260916"
    : "data/countries.json?v=20260916";
}

// Carga (y cachea) el dataset local en data/countries.json
async function loadLocalCountries() {
  if (localCountriesCache) return localCountriesCache;

  const res = await fetch(countriesDataUrl());
  if (!res.ok) throw new Error("No se pudo cargar el catálogo local de países.");

  const data = await res.json();
  localCountriesCache = Array.isArray(data) ? data : [];
  return localCountriesCache;
}

// Encuentra un país por su código en el dataset local (alpha-3 o alpha-2)
async function findLocalCountry(code) {
  const data = await loadLocalCountries();
  return data.find((c) => c.cca3 === code || c.cca2 === code) || null;
}

// Lista completa de países. REST Countries solo si hay clave; si falla,
// se usa el dataset local. Sin clave -> dataset local directamente.
async function fetchAllCountries() {
  if (getRcKey()) {
    try {
      return await fetchAllCountriesV5();
    } catch (err) {
      console.warn("REST Countries no disponible, usando countries.json:", err);
    }
  }
  return loadLocalCountries();
}

// Un país por código. Misma lógica de respaldo que fetchAllCountries.
async function fetchOneCountry(code) {
  if (getRcKey()) {
    try {
      return await fetchCountryV5(code);
    } catch (err) {
      console.warn("REST Countries no disponible para " + code + ", usando countries.json:", err);
    }
  }

  const local = await findLocalCountry(code);
  if (local) return local;
  throw new Error("País no encontrado");
}