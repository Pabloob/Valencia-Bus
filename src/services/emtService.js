//Official EMT Valencia API endpoint for bus stops
const EMT_API_URL = 'https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/226/query?where=1=1&outFields=*&f=json&outSR=4326';

//Fetches and formats all bus stops locations
export const getStops = async () => {
  try {
    const response = await fetch(EMT_API_URL);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    //Map the raw API data to a cleaner format for the app
    return data.features.map((feature) => ({
      id: feature.attributes.id_parada,
      name: feature.attributes.denominacion,
      state: feature.attributes.suprimida,
      coords: [feature.geometry.y, feature.geometry.x],
      nextArrivals: [feature.attributes.proximas_llegadas]
    }));
  } catch (error) {
    console.error("Error al obtener las paradas de la EMT:", error);
    return [];
  }
};

//Scrapes the EMT website to get real-time bus arrivals for a specific stop
export const getArrivals = async (stopId) => {
  try {
    const response = await fetch(`/api-qr/QR.php?sec=est&p=${stopId}`);
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
        const match = img.src.match(/(\d+)/);
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
    console.error("Error en el scraping de llegadas:", error);
    return ["No se pudieron cargar los tiempos"];
  }
};