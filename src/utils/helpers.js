// Cache to store location and avoid asking for GPS multiple times
let saveLocation = null;
//Default map center (Ayuntamiento Valencia) if GPS fails or is denied 
const DEFAULT_LOCATION = [39.4699, -0.3763];

//Get the user's current coordinates and if it is the real location
export const getUserLocation = () => {
    return new Promise((resolve) => {
        //Return cached location if it already exists
        if (saveLocation) {
            return resolve({ coords: saveLocation, isRealLocation: true });
        }

        //Check if the browser supports geolocation
        if (!("geolocation" in navigator)) {
            return resolve({ coords: DEFAULT_LOCATION, isRealLocation: false });
        }

        //Request GPS position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                saveLocation = [position.coords.latitude, position.coords.longitude];
                resolve({ coords: saveLocation, isRealLocation: true });
            },
            (error) => {
                console.warn("Geolocalización rechazada o fallida:", error.message);
                resolve({ coords: DEFAULT_LOCATION, isRealLocation: false });
            },
            {
                enableHighAccuracy: false,
                maximumAge: 180000,
                timeout: 10000 //Timeout after 10 seconds
            }
        );
    });
};

//Delays function execution to prevent spaming API requests
export const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

//Decodes a single varint-encoded value starting at `index`, returns [value, nextIndex]
const decodeValue = (encoded, index) => {
    let shift = 0, result = 0, b;

    do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
    } while (b >= 0x20);

    const delta = (result & 1) ? ~(result >> 1) : (result >> 1);
    return [delta, index];
};

//Decode the polyline of google routes to array
export const decodePolyline = (encoded) => {
    if (!encoded) return [];

    const len = encoded.length;
    //Estimación: cada par lat/lng suele ocupar ~5 bytes -> evita resize del array
    const poly = new Array(Math.ceil(len / 5));
    let index = 0, lat = 0, lng = 0, count = 0;

    while (index < len) {
        const [dlat, nextIndexLat] = decodeValue(encoded, index);
        lat += dlat;
        index = nextIndexLat;

        const [dlng, nextIndexLng] = decodeValue(encoded, index);
        lng += dlng;
        index = nextIndexLng;

        poly[count++] = [lat / 1e5, lng / 1e5];
    }

    poly.length = count;
    return poly;
};