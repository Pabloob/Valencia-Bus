import { ref, watch } from "vue";

//Origin/destination coordinates for route calculation
export const originCords = ref(null);
export const destinyCords = ref(null);

//The user's real GPS location
export const gpsCords = ref(null);

//Origin selection mode: 'gps' (using user's real-time location),
//'manual' (user typed/selected a specific address), or null (no origin yet).
export const originMode = ref(null);

//Visibility filter for stops ('all', 'favorites', 'none', 'selected')
export const stopsFilter = ref('all');

//Selected bus stop
export const selectedStop = ref(null);

//Route steps
export const routeDetails = ref(null);

export const isRoutePanelOpen = ref(false);

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

//Resets the whole route/panel state
export const resetRoute = () => {
  destinyCords.value = null;
  routeDetails.value = null;
  isRoutePanelOpen.value = false;
  selectedStop.value = null;
};