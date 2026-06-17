<script setup>
import {
  isRoutePanelOpen,
  routeDetails,
  resetRoute,
} from "@/utils/globalState";

const closePanel = () => {
  resetRoute();
};

const time = (durationStr) => {
  if (!durationStr) return "0min";

  const seconds = parseInt(durationStr, 10);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};
</script>

<template>
  <div
    v-if="isRoutePanelOpen && routeDetails"
    class="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl z-[1000] flex flex-col max-h-[60vh] overflow-hidden border border-gray-100"
    @wheel.stop
    @mousedown.stop
    @touchstart.stop
    @dblclick.stop
    @click.stop
  >
    <div
      class="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0"
    >
      <h2 class="font-bold text-lg m-0">Ruta sugerida</h2>
      <button
        @click="closePanel"
        class="hover:bg-blue-700 p-1 rounded-full transition-colors focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div
      class="p-4 bg-blue-50 border-b border-blue-100 flex justify-between text-blue-900 font-semibold text-sm shrink-0"
    >
      <span>{{ time(routeDetails.duration) }}</span>
      <span>{{ routeDetails.distance }} m</span>
    </div>

    <div class="p-4 overflow-y-auto flex-1">
      <ul class="space-y-4">
        <li
          v-for="(segment, index) in routeDetails.segments"
          :key="index"
          class="flex gap-3 text-sm text-gray-700 border-l-2 border-blue-200 pl-3 pb-2"
        >
          <div v-if="segment.mode === 'WALK'">
            {{ segment.instructions }}
          </div>
          <div v-else-if="segment.lineNumber" class="font-medium text-blue-700">
            Coge el bus {{ segment.lineNumber }} hacia {{ segment.headsign }}
          </div>
          <div v-else>Avanza al siguiente punto</div>
        </li>
      </ul>
    </div>
  </div>
</template>
