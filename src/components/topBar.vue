<script setup>
import { ref } from "vue";
import SwitchTheme from "./switchTheme.vue";
import { cords } from "../utils/mapStore.js";
import { getUserLocation } from "../utils/utils.js";

// States
const query = ref("");
const suggestions = ref([]);
const searching = ref(false);
const isFocused = ref(false);
let timer = null;

// Get streets based on user input
const search = async () => {
  searching.value = true;

  try {

    const hasNumber = /\d+/.test(query.value);
    
    const searchText = hasNumber ? query.value : `${query.value} 1`;

    const url = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${searchText}, Valencia&limit=5`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("La API no responde");

    let data = await response.json();

    const numberMatch = query.value.match(/\d+/);
    if (numberMatch) {
      const typedNumber = numberMatch[0];
      data = data.filter((suggestion) => {
        if (!suggestion.portalNumber) return true;
        return String(suggestion.portalNumber).startsWith(typedNumber);
      });
    }

    suggestions.value = data;

    return data;
  } catch (error) {
    suggestions.value = [];
    return [];
  } finally {
    searching.value = false;
  }
};

//
const handleDestination = () => {
  clearTimeout(timer);

  if (query.value.trim().length < 3) {
    suggestions.value = [];
    searching.value = false;
    return;
  }

  timer = setTimeout(() => {
    search();
  }, 150);
};

// Send cords of the selected street to the global const used in the map
const selectDirection = (suggestion) => {
  const type = suggestion.tip_via || "";
  const portalNumber = suggestion.portalNumber
    ? ` ${suggestion.portalNumber}`
    : "";

  query.value = `${type} ${suggestion.address}${portalNumber}`.trim();
  suggestions.value = [];
  searching.value = false;

  cords.value = [parseFloat(suggestion.lat), parseFloat(suggestion.lng)];
};

//If the user press enter we search based on the actual input text
const handleEnter = async () => {
  clearTimeout(timer);

  const currentQuery = query.value.trim();

  // 1. The input is empty we get the user cords
  if (currentQuery === "") {
    cords.value = await getUserLocation();
    document.getElementById("stop")?.blur();
    return;
  }

  // 2. Not long enought
  if (currentQuery.length < 3) return;

  // 3. We get the first suggestion
  const resultData = await search();

  if (resultData && resultData.length > 0) {
    selectDirection(resultData[0]);
    document.getElementById("stop")?.blur();
  }
};
</script>

<template>
  <div class="relative w-full max-w-lg mx-auto mt-4 z-50">
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <input
          id="stop"
          v-model="query"
          @input="handleDestination"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown.enter.prevent="handleEnter"
          name="stop"
          type="text"
          placeholder="¿Dónde quieres ir?"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div
          v-if="searching && isFocused && query.length >= 3"
          class="absolute right-3 top-3 text-gray-400"
        >
          <svg
            class="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
      <div class="flex-shrink-0">
        <SwitchTheme />
      </div>
    </div>
    <ul
      v-if="suggestions.length > 0"
      class="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
    >
      <li
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        @mousedown="selectDirection(suggestion)"
        class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
      >
        <p class="text-sm font-medium text-gray-800">
          {{ suggestion.address }}
          {{ suggestion.portalNumber ? suggestion.portalNumber : "" }}
        </p>
      </li>
    </ul>
  </div>
</template>
