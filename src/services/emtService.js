//URL API EMT

const EMT_API_URL = 'https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/226/query?where=1=1&outFields=*&f=json&outSR=4326';

export const getStops = async () => {

  const response = await fetch(EMT_API_URL);

  if (!response.ok) {
    throw new Error("Error HTTP: ${response.status}");
  }

  const data = await response.json();


  const mappedStops = data.features.map((feature) => {

    return {
      id: feature.attributes.id_parada,
      name: feature.attributes.denominacion,
      state: feature.attributes.suprimida,
      coords: [feature.geometry.y, feature.geometry.x],
      nextArraives: [feature.attributes.proximas_llegadas]
    };
  });

  return mappedStops;

}


//Scrap EMT arrivals web
export const getArrivals = async (stopId) => {
  const response = await fetch(`/api-qr/QR.php?sec=est&p=${stopId}`);
  const htmlString = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  
  const arrivals = [];

  //Get only the divs with stop image 
  const busSpans = doc.querySelectorAll('.imagenParada');
  
  busSpans.forEach(span => {

      const rowDiv = span.parentElement;
      
      let busLine = "Bus";
      const img = span.querySelector('img');
      if (img && img.src) {
        const match = img.src.match(/(\d+)/); 
        if (match) {
          busLine = match[0];
        }
      } else {
        busLine = span.innerText.trim(); 
      }

      const infoSpan = rowDiv.querySelector('span:nth-child(2)');
      let infoText = "";
      
      if (infoSpan) {
        infoText = infoSpan.innerText.replace(/\s+/g, ' ').trim();
      } else {
        infoText = rowDiv.innerText.replace(span.innerText, '').replace(/\s+/g, ' ').trim();
      }

      if (infoText) {
        arrivals.push(`Línea ${busLine}: ${infoText}`);
      }
    
  });
  
  return arrivals;
}