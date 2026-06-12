<script setup>
import { ref, onMounted, computed } from "vue";
import "leaflet/dist/leaflet.css";
import { getStops } from "../services/emtService";
import {
  LMap,
  LTileLayer,
  LPopup,
  LCircleMarker,
} from "@vue-leaflet/vue-leaflet";

import Stops from "./stops.vue";

const center = ref([39.4699, -0.3763]);
const zoom = ref(10);
const bounds = ref(null);
const userLocation = ref(null);
const mapRef = ref(null);

const allStops = ref([]);

const visibleStops = computed(() => {
  if (zoom.value < 15) return [];

  if (!bounds.value || allStops.value.length === 0) return [];

  return allStops.value.filter((stop) => {
    return bounds.value.contains(stop.coords);
  });
});

onMounted(async () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = [position.coords.latitude, position.coords.longitude];

      if (mapRef.value) {
        mapRef.value.leafletObject.flyTo(coords, 16, {
          animate: true,
          duration: 1,
        });
      }

      userLocation.value = coords;
    });
  }

  allStops.value = await getStops();
});
</script>

<template>
  <div
    class="w-[90%] mx-auto h-[500px] rounded-xl overflow-hidden shadow-inner mt-4 border border-gray-200 relative z-0"
  >
    <l-map
      ref="mapRef"
      v-model:zoom="zoom"
      v-model:center="center"
      v-model:bounds="bounds"
      :use-global-leaflet="false"
      :options="{ zoomControl: false, attributionControl: false }"
    >
      <l-tile-layer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        layer-type="base"
        name="Carto Voyager"
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
      />

      <Stops :visibleStops="visibleStops" />

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
          <p class="font-semibold text-sm m-0">You</p>
        </l-popup>
      </l-circle-marker>
    </l-map>
  </div>
</template>
