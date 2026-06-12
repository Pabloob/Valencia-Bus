<script setup>
import { ref } from "vue";
import "leaflet/dist/leaflet.css";
import { getArrivals } from "../services/emtService";
import { LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import L from "leaflet";

const props = defineProps({
  visibleStops: Object,
});

const isLoadingArrivals = ref(false);
const selectedArrivals = ref([]);

const getBusSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="${color}" stroke="none">
    <path d="M2355 4844 c-379 -56 -696 -209 -954 -458 -263 -255 -429 -566 -492 -922 -27 -154 -29 -398 -5 -569 90 -630 456 -1328 1085 -2065 144 -169 549 -580 571 -580 20 0 398 381 541 545 556 639 921 1269 1064 1835 69 272 87 599 46 834 -27 151 -86 330 -157 471 -194 390 -566 707 -985 840 -175 55 -259 68 -479 70 -113 2 -218 1 -235 -1z m522 -318 c401 -101 730 -365 908 -731 99 -204 130 -344 130 -595 0 -141 -4 -205 -18 -270 -59 -275 -177 -490 -377 -690 -200 -200 -415 -318 -690 -377 -120 -26 -420 -26 -540 0 -258 56 -480 172 -667 351 -198 188 -323 404 -391 674 -25 99 -27 123 -27 312 0 189 2 213 27 312 67 264 191 481 380 664 176 170 379 286 607 344 135 34 186 39 376 35 152 -3 196 -7 282 -29z"/>
    <path d="M2240 4041 l0 -119 -112 -4 c-121 -4 -156 -15 -211 -67 -46 -42 -70 -98 -75 -178 l-5 -73 -78 0 -79 0 0 -80 0 -80 80 0 80 0 0 -365 c0 -245 4 -372 11 -388 14 -32 49 -47 104 -47 l45 0 0 -120 0 -120 160 0 160 0 0 120 0 120 240 0 240 0 0 -120 0 -120 160 0 160 0 0 120 0 120 45 0 c55 0 90 15 104 47 7 16 11 143 11 388 l0 365 80 0 80 0 0 80 0 80 -79 0 -78 0 -5 73 c-7 106 -49 175 -133 220 -32 17 -63 22 -152 25 l-113 4 0 119 0 119 -320 0 -320 0 0 -119z m855 -306 l25 -24 0 -256 0 -255 -560 0 -560 0 0 255 0 256 25 24 24 25 511 0 511 0 24 -25z m-917 -709 c56 -31 78 -111 46 -166 -62 -104 -222 -62 -224 58 -1 92 99 152 178 108z m880 0 c56 -31 78 -111 46 -166 -62 -104 -222 -62 -224 58 -1 92 99 152 178 108z"/>
  </g>
</svg>
`;

const handlePopupOpen = async (stopId) => {
  isLoadingArrivals.value = true;
  selectedArrivals.value = await getArrivals(stopId);
  isLoadingArrivals.value = false;
};

const createBusIcon = (stop) => {
  const isSuppressed = stop.state == 1;
  const iconColor = isSuppressed ? "#ef4444" : "#1c53c3";

  return L.divIcon({
    html: getBusSvg(iconColor),
    className: "stop-marker-outer",
    iconSize: [36, 36],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};
</script>

<template>
  <l-marker
    v-for="stop in visibleStops"
    :key="stop.id"
    :lat-lng="stop.coords"
    :icon="createBusIcon(stop)"
    @click="handlePopupOpen(stop.id)"
  >
    <l-popup>
      <div class="p-1">
        <h3 class="font-bold text-blue-600 m-0 text-sm">Parada nº {{ stop.id }}</h3>
        <p class="text-xs text-gray-600 mt-1 m-0">{{ stop.name }}</p>

        <div
          v-if="stop.state === 1"
          class="text-xs text-red-500 font-bold mt-1"
        >
          PARADA SUPRIMIDA
        </div>

        <div v-else class="mt-2 border-t pt-2 border-gray-200">
          <div v-if="isLoadingArrivals" class="text-center py-4">
            <span class="text-sm text-gray-500 animate-pulse"
              >Obteniendo tiempos...</span
            >
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="(arrival, index) in selectedArrivals"
              :key="index"
              class="bg-blue-50 border border-blue-100 rounded p-2 text-sm text-blue-900 shadow-sm"
            >
              <span class="font-semibold">{{ arrival }}</span>
            </li>

            <li
              v-if="selectedArrivals.length === 0"
              class="text-sm text-gray-500 italic text-center"
            >
              Sin información disponible.
            </li>
          </ul>
        </div>
      </div>
    </l-popup>
  </l-marker>
</template>