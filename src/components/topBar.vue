<script setup>
import { ref } from "vue";

// States
const query = ref("");
const suggestions = ref([]);
const searching = ref(false);

//Variable for debounce time
let timer = null;

//Suggestions for destination

const handleDestination = () => {
  clearTimeout(timer);

  if (query.value.length < 3) {
    suggestions.value = [];
    return;
  }

  timer = setTimeout(async () => {
    searching.value = true;
    const url = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${query.value}, Valencia&limit=5`;
    const response = await fetch(url);
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
    searching.value = false;
  }, 200);
};

const selectDirection = (suggestion) => {
  const type = suggestion.tip_via || "";
  const portalNumber = suggestion.portalNumber
    ? ` ${suggestion.portalNumber}`
    : "";

  query.value = `${type} ${suggestion.address}${portalNumber}`.trim();
  suggestions.value = [];

  const lat = suggestion.lat;
  const lng = suggestion.lng;
  console.log("Coordenadas del portal:", lat, lng);
};
</script>

<template>
  <div class="top-bar-section">
    <div class="relative">
      <input
        id="stop"
        v-model="query"
        @input="handleDestination"
        name="stop"
        type="text"
        placeholder="¿Dónde quieres ir?"
        class="top-bar-input"
      />
      <div v-if="searching" class="absolute right-3 top-3 text-gray-400">
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

    <ul v-if="suggestions.length > 0" class="top-bar-suggestion-container">
      <li
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        @click="selectDirection(suggestion)"
        class="top-bar-suggestion"
      >
        <p class="top-bar-suggestion-text">
          {{ suggestion.address }}
          {{ suggestion.portalNumber ? suggestion.portalNumber : "" }}
        </p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.top-bar-section {
  @apply relative w-full max-w-lg mx-auto mt-4 z-50;
}
.top-bar-input {
  @apply w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
.top-bar-suggestion-container {
  @apply absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50;
}
.top-bar-suggestion {
  @apply px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors z-50;
}
.top-bar-suggestion-text {
  @apply text-sm font-medium text-gray-800 z-50;
}
</style>
