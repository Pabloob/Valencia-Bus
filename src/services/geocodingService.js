//Searches for a street name and returns coordinates using Photon API
const PHOTON_URL = "https://photon.komoot.io/api/";
const SEARCH_TIMEOUT_MS = 6000;
const SEARCH_CACHE_TTL_MS = 2 * 60 * 1000;

const searchCache = new Map();

export const searchLocation = async (query, { signal } = {}) => {
    const hasNumber = /\d+/.test(query);
    //Add "1" to the query if no number is provided to force better API results
    const searchText = hasNumber ? query : `${query} 1`;
    // const url = `${CARTOCIUDAD_URL}?q=${encodeURIComponent(`${searchText}, Valencia`)}&limit=5`;

    const url = `${PHOTON_URL}?q=${encodeURIComponent(searchText + " Valencia")}&limit=5`;
    const cached = searchCache.get(url);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
        return filterByNumber(cached.data, query);
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), SEARCH_TIMEOUT_MS);

    if (signal) {
        signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }

    try {
        const response = await fetch(url, { signal: timeoutController.signal });
        if (!response.ok) throw new Error("La API de mapas no responde");

        const data = await response.json();

        const formattedData = data.features
            .filter(f => f.properties.street || f.properties.name) // Solo resultados con nombre
            .map(f => ({
                tip_via: "", // Photon incluye el tipo ("Calle") directamente en el nombre
                address: f.properties.street || f.properties.name,
                portalNumber: f.properties.housenumber || "",
                municipality: f.properties.city || f.properties.town || "Valencia",
                // ¡Ojo! GeoJSON devuelve [Longitud, Latitud], pero Leaflet usa [Latitud, Longitud]
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0]
            }));

        searchCache.set(url, { data, timestamp: Date.now() });

        return formattedData;
    } finally {
        clearTimeout(timeoutId);
    }
};

//Filter to match the exact street number requested by the user
const filterByNumber = (data, query) => {
    const numberMatch = query.match(/\d+/);
    if (!numberMatch) return data;

    const typedNumber = numberMatch[0];
    return data.filter((suggestion) => {
        if (!suggestion.portalNumber) return true;
        return String(suggestion.portalNumber).startsWith(typedNumber);
    });
};