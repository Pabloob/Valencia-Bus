import { ref,watch } from "vue";

//Cords for the map view
export const cords = ref([]);

//Visibility filter for stops ('all', 'favorites', 'none')
export const stopsFilter = ref('all');

//Current visual style of the Leaflet map
export const currentMapStyle = ref("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png");

//Load saved favorite stops from the browser's memory
const saves = localStorage.getItem("favoriteStops");
export const favoriteStops = ref(saves ? JSON.parse(saves) : []);

//Auto-save to LocalStorage whenever the favorite array changes
watch(favoriteStops, (newFavorites) => {
  localStorage.setItem("favoriteStops", JSON.stringify(newFavorites));
}, { deep: true });