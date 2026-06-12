//URL API EMT

const EMT_API_URL = 'https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/226/query?where=1=1&outFields=*&f=json&outSR=4326';

export const getStops = async () => {

  const respose = await fetch(EMT_API_URL);

  if (!Response.ok) { 
    throw new Error("Error HTTP: ${response.status}") 
    return [];
  };

  const data = await response.json();

  const mappedStops = data.features.map(() => {

    return {
      id: feature.attributes.id_parada,
      name: feature.attributes.denominacion,
      state: feature.attributes.suprimida,
      lng: feature.geometry.x,
      lat: feature.geometry.y,
    };
  });

  return mappedStops;

}

export const getAllStopsNames = async () =>{

  const response = await fetch(EMT_API_URL);

    if (!Response.ok) { 
    throw new Error("Error HTTP: ${response.status}") 
    return [];
  };

  const data = await response.json();

  const stopsNames = data.features.map(()=>{

    return {
      name: feature.attributes.denominacion
    }

  })

}