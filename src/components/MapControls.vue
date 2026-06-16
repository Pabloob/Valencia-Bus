<script setup>
import { ref } from "vue";
import { currentMapStyle, stopsFilter, MAP_STYLES } from "../utils/globalState.js";
import OptionsSubmenu from "./MapControlsDropdown.vue";

//Emits an event to refresh the map data
const emit = defineEmits(["refresh-data"]);

//Local state for the options dropdown
const isMenuOpen = ref(false);

const styleOptions = [
  { label: "Mapa Claro", value: MAP_STYLES.light },
  { label: "Modo Noche", value: MAP_STYLES.dark },
  { label: "Satélite", value: MAP_STYLES.satellite },
];

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Favoritas", value: "favorites" },
  { label: "Ocultar", value: "none" },
];

//Updates the global map style and closes the menu
const changeStyle = (url) => {
  currentMapStyle.value = url;
  isMenuOpen.value = false;
};

//Updates the global visibility filter for stops and closes the menu
const changeFilter = (filterName) => {
  stopsFilter.value = filterName;
  isMenuOpen.value = false;
};

const handleRefresh = () => {
  emit("refresh-data");
  isMenuOpen.value = false;
};
</script>

<template>
  <div class="relative inline-flex">
    <button
      @click="isMenuOpen = !isMenuOpen"
      type="button"
      class="flex justify-center items-center size-9 text-sm font-semibold rounded-lg bg-white border border-gray-200 text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors z-[1000]"
    >
      <svg
        class="flex-none size-4 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95 translate-y-2"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 translate-y-2"
    >
      <div
        v-show="isMenuOpen"
        class="absolute bottom-full right-0 mb-2 min-w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000]"
      >
        <div class="p-1 space-y-0.5">
          <OptionsSubmenu
            title="Estilos"
            :items="styleOptions"
            @select="changeStyle"
          />
          <OptionsSubmenu
            title="Mostrar"
            :items="filterOptions"
            @select="changeFilter"
          />

          <a
            class="flex items-center justify-end gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
            href="#"
            @click.prevent="handleRefresh"
          >
            Actualizar
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>
