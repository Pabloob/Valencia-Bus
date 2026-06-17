<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import "leaflet/dist/leaflet.css";
import { getStops } from "../services/emtService";
import { getRoute } from "@/services/googleRoutesService";
import { getUserLocation } from "../utils/helpers.js";
import {
  originCords,
  destinyCords,
  originMode,
  gpsCords,
  favoriteStops,
  selectedStop,
  stopsFilter,
  currentMapStyle,
  routeDetails,
  isRoutePanelOpen,
  resetRoute,
} from "../utils/globalState.js";
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LCircleMarker,
  LPolyline,
} from "@vue-leaflet/vue-leaflet";

import Stops from "./BusStopMarkers.vue";
import MapOptions from "./MapControls.vue";
import RoutePanel from "./RouteStepsPanel.vue";

//Map and UI states
const loading = ref(true);
const showStops = ref(true);
const routeSegments = ref([]);
const center = ref([39.4699, -0.3763]);
const zoom = ref(16);
const bounds = ref(null);
const userLocation = ref(null);
const mapRef = ref(null);
const allStops = ref([]);
const showRightClickPanel = ref(false);
const mouseCoords = ref(null);

let routeAbortController = null;

//Filters stops based on current view bounds and global user filters
const visibleStops = computed(() => {
  //If a route is active for a specific stop, ONLY show that stop
  if (selectedStop.value) {
    return allStops.value.filter((stop) => stop.id === selectedStop.value);
  }

  //Returns empty if zoomed out too much or map hasn't loaded bounds
  if (zoom.value < 15 || !bounds.value || allStops.value.length === 0) {
    return [];
  }

  return allStops.value.filter((stop) => {
    if (!bounds.value.contains(stop.coords)) return false;
    if (stopsFilter.value === "none") return false;
    if (stopsFilter.value === "favorites")
      return favoriteStops.value.includes(stop.id);

    //Returns 'all' by default
    return true;
  });
});

//Refreshes the map (force bypasses the internal cache in getStops, since
//this is an explicit user action expecting fresh data)
const handleRefresh = async () => {
  loading.value = true;
  allStops.value = await getStops({ force: true });
  loading.value = false;
};

//Centers the map on the user location
const centerMap = async () => {
  const { coords } = await getUserLocation();
  userLocation.value = coords;
  flyTo(coords, 17);
};

//Flies to coordinates if the map is loaded
const flyTo = (coords, zoomLevel = 17) => {
  mapRef.value?.leafletObject?.flyTo(coords, zoomLevel, {
    animate: true,
    duration: 1.5,
  });
};

//Handles right-click events on the map surface
const handleRightClick = (e) => {

  //Remove the icon if the user click in the same place aprox
  if (showRightClickPanel.value && mouseCoords.value) {
    const [oldLat, oldLng] = mouseCoords.value;
    const newLatLng = e.latlng;

    const distance = newLatLng.distanceTo([oldLat, oldLng]);

    if (distance < 20) {
      showRightClickPanel.value = false;
      mouseCoords.value = null;
      return;
    }
  }

  mouseCoords.value = [e.latlng.lat, e.latlng.lng];
  showRightClickPanel.value = true;
};

//Handle button of right-click
const planRouteToPoint = () => {
  destinyCords.value = mouseCoords.value;
};

//Calculates the route between the current origin and destination,
//updating route state and flying the map. Cancels any in-flight request
//before starting a new one to avoid race conditions.
const calculateRoute = async (origin, destination) => {
  routeAbortController?.abort();

  if (!origin || !destination || destination.length !== 2) {
    //Avoid calling resetRoute (which sets destinyCords = null) if there's
    //nothing to reset — prevents an extra redundant watcher cycle.
    if (routeSegments.value.length > 0 || destinyCords.value) {
      routeSegments.value = [];
      resetRoute();
    }

    return;
  }

  routeAbortController = new AbortController();

  const routeData = await getRoute(origin, destination, {
    signal: routeAbortController.signal,
  });

  if (routeData != null) {
    routeSegments.value = routeData.segments;

    routeDetails.value = {
      duration: routeData.duration,
      distance: routeData.distance,
      segments: routeData.segments,
    };

    isRoutePanelOpen.value = true;

    if (mapRef.value?.leafletObject) {
      //Use allCoords to center the camera perfectly
      mapRef.value.leafletObject.fitBounds(routeData.allCoords, {
        padding: [50, 50],
        animate: true,
        duration: 1.5,
      });
    }
  } else {
    routeSegments.value = [];
    resetRoute();
  }
};

//Watches both origin and destination: recalculates the route whenever
//either one changes, so editing the origin after a route already exists
//(e.g. pressing Enter on the top input) also triggers a recalculation.
watch([originCords, destinyCords], ([origin, destination]) => {
  calculateRoute(origin, destination);
});

//Saves map limits (bounds) when the map is fully loaded
const onMapReady = (mapInstance) => {
  bounds.value = mapInstance.getBounds();
};

//Initial data fetch: gets stops and user location.
//If a real GPS location is found, it's set as the default origin in "gps" mode.
onMounted(async () => {
  const [stops, locationResult] = await Promise.all([
    getStops(),
    getUserLocation(),
  ]);

  allStops.value = stops;
  userLocation.value = locationResult.coords;
  center.value = locationResult.coords;

  if (locationResult.isRealLocation) {
    gpsCords.value = locationResult.coords;
    originCords.value = locationResult.coords;
    originMode.value = "gps";
  }

  loading.value = false;
});

onBeforeUnmount(() => {
  routeAbortController?.abort();
});
</script>

<template>
  <div
    class="w-[90%] mx-auto h-[600px] rounded-xl overflow-hidden shadow-inner mt-4 border border-gray-200 relative z-0 flex justify-center items-center bg-gray-50 dark:bg-[#F6EFE4]"
  >
    <div
      v-if="loading"
      class="flex flex-col items-center text-stone-500 dark:text-neutral-400"
    >
      <span class="inline-flex gap-x-1.5">
        <span
          class="size-2 bg-blue-500 animate-[typing_1s_ease-in-out_infinite] rounded-full"
        ></span>
        <span
          class="size-2 bg-blue-500 animate-[typing_1s_ease-in-out_infinite_0.2s] rounded-full"
        ></span>
        <span
          class="size-2 bg-blue-500 animate-[typing_1s_ease-in-out_infinite_0.4s] rounded-full"
        ></span>
      </span>
      <p class="mt-4 text-sm font-medium tracking-wide">
        Buscando paradas cercanas...
      </p>
    </div>

    <l-map
      v-else
      ref="mapRef"
      @ready="onMapReady"
      @contextmenu="handleRightClick"
      v-model:zoom="zoom"
      v-model:center="center"
      v-model:bounds="bounds"
      :use-global-leaflet="false"
      :options="{
        zoomControl: false,
        attributionControl: false,
      }"
      class="w-full h-full"
    >
      <l-tile-layer :url="currentMapStyle" layer-type="base" name="Carto Map" />

      <Stops v-if="showStops" :visibleStops="visibleStops" />
      <RoutePanel />

      <l-marker
        v-if="showRightClickPanel && mouseCoords"
        :lat-lng="mouseCoords"
      >
        <l-popup :options="{ closeButton: true, autoClose: false }">
          <div class="p-1 text-center">
            <p class="text-xs text-gray-500 mb-2 mt-0">
              Ubicación seleccionada
            </p>

            <button
              type="button"
              @click="planRouteToPoint"
              class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1.5 px-4 rounded shadow-sm transition-colors w-full"
            >
              📍 Llegar aquí
            </button>
          </div>
        </l-popup>
      </l-marker>

      <l-polyline
        v-for="(segment, index) in routeSegments"
        :key="index"
        :lat-lngs="segment.coords"
        :color="segment.mode === 'WALK' ? '#DE15E8' : '#2563eb'"
        :dash-array="segment.mode === 'WALK' ? '5, 10' : null"
        :weight="6"
        :opacity="0.8"
      />

      <l-circle-marker
        v-if="userLocation"
        :lat-lng="userLocation"
        :radius="8"
        color="#ffffff"
        fill-color="#3b82f6"
        :fill-opacity="1"
        :weight="3"
      >
        <l-popup>
          <p class="font-semibold text-sm m-0">Tú estás aquí</p>
        </l-popup>
      </l-circle-marker>
    </l-map>

    <div
      v-if="!loading"
      class="absolute bottom-4 right-4 z-[1000] flex items-center gap-3"
    >
      <button
        @click="centerMap"
        type="button"
        class="flex justify-center items-center size-9 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
        title="Volver a centrar"
      >
        <div
          class="size-4 rounded-full border-2 border-blue-500 flex items-center justify-center"
        >
          <div class="size-1.5 rounded-full bg-blue-500"></div>
        </div>
      </button>
      <MapOptions @refresh-data="handleRefresh" />
    </div>
  </div>
</template>

<style>
@keyframes typing {
  0% {
    opacity: 1;
    scale: 1;
  }
  50% {
    opacity: 0.75;
    scale: 0.75;
  }
  100% {
    opacity: 1;
    scale: 1;
  }
}
</style>
