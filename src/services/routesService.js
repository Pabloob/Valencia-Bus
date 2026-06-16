import { decodePolyline } from '../utils/utils.js';

//Get API key from environment variables
const GOOGLE_API_KEY = process.env.VUE_APP_GOOGLE_API_KEY;
const GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

//Define exactly what data we want back to save bandwidth
const FIELD_MASK = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps';
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000;

//In-memory cache to prevent redundant API calls
const routeCache = new Map();

//Create a unique cache key using start and end coordinates
const buildCacheKey = (lat1, lng1, lat2, lng2) =>
    `${lat1.toFixed(5)},${lng1.toFixed(5)}|${lat2.toFixed(5)},${lng2.toFixed(5)}`;

//Build the specific JSON payload for the Google API
const buildRequestBody = (lat1, lng1, lat2, lng2) => ({
    origin: { location: { latLng: { latitude: lat1, longitude: lng1 } } },
    destination: { location: { latLng: { latitude: lat2, longitude: lng2 } } },
    travelMode: "TRANSIT",
    transitPreferences: { allowedTravelModes: ["BUS"] },
    languageCode: "es-ES",
    units: "METRIC"
});

//Clean and format the raw API response into our app's format
const mapRouteResponse = (route) => ({
    duration: route.duration,
    distance: route.distanceMeters,
    steps: route.legs[0].steps,
    coordinates: decodePolyline(route.polyline.encodedPolyline)
});

export const getRoute = async (originCoords, destinationCoords, { signal } = {}) => {
    //Ensure coordinates are numbers
    const lat1 = Number(originCoords[0]);
    const lng1 = Number(originCoords[1]);
    const lat2 = Number(destinationCoords[0]);
    const lng2 = Number(destinationCoords[1]);

    //Check if we already have this route in cache
    const cacheKey = buildCacheKey(lat1, lng1, lat2, lng2);
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    //Setup request timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

    //Link external abort signal if provided
    if (signal) {
        signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }

    try {
        //Make the POST request to Google Routes API
        const response = await fetch(GOOGLE_ROUTES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': FIELD_MASK
            },
            body: JSON.stringify(buildRequestBody(lat1, lng1, lat2, lng2)),
            signal: timeoutController.signal
        });

        //Handle HTTP errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error("Detalle del error de Google:", errorData);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        //Handle empty results (no bus route found)
        if (!data.routes || data.routes.length === 0) {
            console.warn("Google no encontró ninguna ruta de autobús.");
            return null;
        }

        //Format data and save to cache
        const result = mapRouteResponse(data.routes[0]);
        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;

    } catch (error) {
        //Differentiate between timeout/abort and actual errors
        if (error.name === 'AbortError') {
            console.warn(signal?.aborted ? "Petición cancelada por el usuario." : "Timeout calculando la ruta.");
        } else {
            console.error("Excepción calculando la ruta:", error);
        }
        return null;

    } finally {
        //Always clean up the timeout to prevent memory leaks
        clearTimeout(timeoutId);
    }
};

//Helper to manually clear the cache if needed
export const clearRouteCache = () => routeCache.clear();