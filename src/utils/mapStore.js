import { ref, watch } from "vue";

//Cords for the map view
export const cords = ref([]);

//Visibility filter for stops ('all', 'favorites', 'none')
export const stopsFilter = ref('all');

//Map tile style options
export const MAP_STYLES = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

//Current visual style of the Leaflet map
export const currentMapStyle = ref(MAP_STYLES.light);

//Load saved favorite stops from the browser's memory
const STORAGE_KEY = "favoriteStops";
const saved = localStorage.getItem(STORAGE_KEY);
export const favoriteStops = ref(saved ? JSON.parse(saved) : []);

//Auto-save to LocalStorage whenever the favorite array changes
watch(favoriteStops, (newFavorites) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
}, { deep: true });