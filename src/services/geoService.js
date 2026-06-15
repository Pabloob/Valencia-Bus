//Searches for a street name and returns coordinates using CartoCiudad API
export const searchLocation = async (query) => {
    const hasNumber = /\d+/.test(query);
    //Add "1" to the query if no number is provided to force better API results
    const searchText = hasNumber ? query : `${query} 1`;
    const url = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${searchText}, Valencia&limit=5`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("La API de mapas no responde");

    let data = await response.json();

    //Filter to match the exact street number requested by the user
    const numberMatch = query.match(/\d+/);
    if (numberMatch) {
        const typedNumber = numberMatch[0];
        data = data.filter((suggestion) => {
            if (!suggestion.portalNumber) return true;
            return String(suggestion.portalNumber).startsWith(typedNumber);
        });
    }

    return data;
};