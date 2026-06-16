//Official EMT Valencia API endpoint for bus stops
const EMT_API_URL = 'https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/226/query?where=1=1&outFields=*&f=json&outSR=4326';

//Cache of stops
const STOPS_CACHE_TTL_MS = 10 * 60 * 1000;
let stopsCache = null;
let stopsCacheTimestamp = 0;
let inFlightStopsRequest = null;

//Fetches and formats all bus stops locations
export const getStops = async ({ force = false } = {}) => {
  const isCacheValid = stopsCache && (Date.now() - stopsCacheTimestamp < STOPS_CACHE_TTL_MS);
  if (!force && isCacheValid) {
    return stopsCache;
  }

  if (inFlightStopsRequest) {
    return inFlightStopsRequest;
  }

  inFlightStopsRequest = (async () => {
    try {
      const response = await fetch(EMT_API_URL);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      //Map the raw API data to a cleaner format for the app
      const stops = data.features.map((feature) => ({
        id: feature.attributes.id_parada,
        name: feature.attributes.denominacion,
        state: feature.attributes.suprimida,
        coords: [feature.geometry.y, feature.geometry.x],
        nextArrivals: [feature.attributes.proximas_llegadas]
      }));

      stopsCache = stops;
      stopsCacheTimestamp = Date.now();
      return stops;
    } catch (error) {
      console.error("Error al obtener las paradas de la EMT:", error);
      return stopsCache ?? [];
    } finally {
      inFlightStopsRequest = null;
    }
  })();

  return inFlightStopsRequest;
};

const ARRIVALS_TIMEOUT_MS = 6000;
const LINE_NUMBER_REGEX = /(\d+)/;

//Scrapes the EMT website to get real-time bus arrivals for a specific stop
export const getArrivals = async (stopId, { signal: externalSignal } = {}) => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), ARRIVALS_TIMEOUT_MS);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  try {
    const response = await fetch(`/api-qr/QR.php?sec=est&p=${stopId}`, {
      signal: timeoutController.signal
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    //Convert response to text and parse it as HTML to read the DOM
    const htmlString = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const arrivals = [];
    const busSpans = doc.querySelectorAll('.imagenParada');

    //Loop through each bus element found in the HTML
    busSpans.forEach(span => {
      const rowDiv = span.parentElement;
      let busLine = "Bus";
      const img = span.querySelector('img');

      //Try to extract the bus line number from the image URL
      if (img?.src) {
        const match = img.src.match(LINE_NUMBER_REGEX);
        if (match) busLine = match[0];
      } else {
        busLine = span.innerText.trim();
      }

      //Extract the arrival time text
      const infoSpan = rowDiv.querySelector('span:nth-child(2)');
      const infoText = infoSpan
        ? infoSpan.innerText.replace(/\s+/g, ' ').trim()
        : rowDiv.innerText.replace(span.innerText, '').replace(/\s+/g, ' ').trim();

      if (infoText) arrivals.push(`Línea ${busLine}: ${infoText}`);
    });

    return arrivals.length ? arrivals : ["Sin información en este momento"];
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(externalSignal?.aborted ? "Petición de llegadas cancelada." : "Timeout obteniendo llegadas.");
    } else {
      console.error("Error en el scraping de llegadas:", error);
    }
    return ["No se pudieron cargar los tiempos"];
  } finally {
    clearTimeout(timeoutId);
  }
};