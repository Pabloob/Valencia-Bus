// Cache to store location and avoid asking for GPS multiple times
let saveLocation = null;
//Default map center (Ayuntamiento Valencia) if GPS fails or is denied 
const DEFAULT_LOCATION = [39.4699, -0.3763];

//Get the user's current coordinates
export const getUserLocation = () => {
    return new Promise((resolve) => {
        //Return cached location if it already exists
        if (saveLocation) {
            return resolve(saveLocation);
        }

        //Check if the browser supports geolocation
        if (!("geolocation" in navigator)) {
            return resolve(DEFAULT_LOCATION);
        }

        //Request GPS position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                saveLocation = [position.coords.latitude, position.coords.longitude];
                resolve(saveLocation);
            },
            (error) => {
                console.warn("Geolocalización rechazada o fallida:", error.message);
                resolve(DEFAULT_LOCATION);
            },
            {
                enableHighAccuracy: false,
                maximumAge: 180000,
                timeout: 5000 //Timeout after 5 seconds
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