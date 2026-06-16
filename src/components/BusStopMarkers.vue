<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import "leaflet/dist/leaflet.css";
import { getArrivals } from "../services/emtService";
import { cords, selectedStop } from "../utils/globalState.js";
import { LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import { favoriteStops } from "../utils/globalState.js";
import { createBusIcon } from "../utils/markerIcons.js";

//Receives the array of currently visible stops
const props = defineProps({ visibleStops: Object });

const isLoadingArrivals = ref(false);
const selectedArrivals = ref([]);
//Controls whether the arrivals list is fully expanded
const isExpanded = ref(false);

//ID of the active stop popup and controller to cancel requests
//if the user opens another popup before it finishes
//(prevents arrivals from an old stop from overwriting current ones)
let activeStopId = null;
let arrivalsAbortController = null;

//Returns either all arrivals or just the first 3 based on expanded state
const displayedArrivals = computed(() => {
  return isExpanded.value
    ? selectedArrivals.value
    : selectedArrivals.value.slice(0, 3);
});

//Fetches arrival times from the API when a stop marker is clicked
const handlePopupOpen = async (stopId) => {
  arrivalsAbortController?.abort();
  arrivalsAbortController = new AbortController();
  activeStopId = stopId;

  //Resets the expanded state when opening a new popup
  isExpanded.value = false;
  isLoadingArrivals.value = true;

  const arrivals = await getArrivals(stopId, {
    signal: arrivalsAbortController.signal,
  });

  //Discards the response if another stop popup was opened in the meantime
  if (activeStopId !== stopId) return;

  selectedArrivals.value = arrivals;
  isLoadingArrivals.value = false;
};

//Clears the drawn route when the popup is closed
const handlePopupClose = () => {
  cords.value = null;
};

//Handles how to arrive to that stop
//Handles how to arrive to that stop
const handleRoute = async (stop) => {
  cords.value = [stop.coords[0], stop.coords[1]];
  selectedStop.value = stop.id;
};

//Adds or removes the stop ID from the global favorites array
const toggleFavorite = (stopId) => {
  favoriteStops.value = favoriteStops.value.includes(stopId)
    ? favoriteStops.value.filter((id) => id !== stopId)
    : [...favoriteStops.value, stopId];
};

onBeforeUnmount(() => {
  arrivalsAbortController?.abort();
});
</script>

<template>
  <l-marker
    v-for="stop in visibleStops"
    :key="stop.id"
    :lat-lng="stop.coords"
    :icon="createBusIcon(stop)"
    @click="handlePopupOpen(stop.id)"
    @popupclose="handlePopupClose"
  >
    <l-popup>
      <div class="p-1 min-w-[220px]">
        <div class="flex justify-between items-start pr-4">
          <div class="flex flex-col">
            <h3 class="font-bold text-blue-700 m-0 text-base">
              Parada nº {{ stop.id }}
            </h3>
            <p class="text-xs text-gray-500 mt-1 m-0 leading-tight">
              {{ stop.name }}
            </p>
          </div>

          <button
            type="button"
            @click="toggleFavorite(stop.id)"
            class="transition-all duration-200 focus:outline-none shrink-0 ml-3 mt-0.5"
            title="Añadir a favoritos"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 transition-all duration-200"
              :class="[
                favoriteStops.includes(stop.id)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-400 fill-none hover:text-yellow-500',
              ]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.536a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="stop.state === 1"
          class="text-xs text-center text-white bg-red-500 font-bold mt-3 py-1.5 rounded shadow-sm"
        >
          PARADA SUPRIMIDA
        </div>

        <div v-else class="mt-3">
          <div v-if="isLoadingArrivals" class="text-center py-3">
            <span class="text-xs text-gray-500 animate-pulse"
              >Obteniendo tiempos...</span
            >
          </div>

          <ul v-else class="space-y-1.5">
            <li
              v-for="(arrival, index) in displayedArrivals"
              :key="index"
              class="bg-slate-50 border border-slate-200 rounded p-2.5 text-sm text-slate-800 shadow-sm"
            >
              <span class="font-medium">{{ arrival }}</span>
            </li>

            <li v-if="selectedArrivals.length > 3" class="pt-1">
              <button
                type="button"
                @click="isExpanded = !isExpanded"
                class="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-semibold py-1.5 transition-colors focus:outline-none"
              >
                {{
                  isExpanded
                    ? "Ocultar"
                    : `Ver ${selectedArrivals.length - 3} más...`
                }}
              </button>
            </li>

            <li
              v-if="selectedArrivals.length === 0"
              class="text-xs text-gray-500 italic text-center py-3 bg-gray-50 rounded border border-gray-100"
            >
              Sin información disponible.
            </li>
          </ul>
        </div>
        <button
          type="button"
          @click="handleRoute(stop)"
          class="mt-3 w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-1.5 px-3 rounded-md transition-colors text-sm font-semibold shadow-sm"
        >
          <img src="../assets/route.svg" class="w-4 h-4 opacity-80" />
          Cómo llegar
        </button>
      </div>
    </l-popup>
  </l-marker>
</template>
