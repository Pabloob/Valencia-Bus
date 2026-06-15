let saveLocation = null;

export const getUserLocation = () => {
    return new Promise((resolve) => {
        if (saveLocation) {
            return resolve(saveLocation);
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    saveLocation = [position.coords.latitude, position.coords.longitude];
                    resolve(saveLocation);
                },
                (error) => {
                    resolve([39.4699, -0.3763]);
                },
                {
                    enableHighAccuracy: false,
                    maximumAge: 180000,
                }
            );
        } else {
            resolve([39.4699, -0.3763]);
        }
    });
};