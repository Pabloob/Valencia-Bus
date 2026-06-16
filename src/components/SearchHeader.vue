<script setup>
import { ref, onBeforeUnmount } from "vue";
import SwitchTheme from "./ThemeToggle.vue";
import { searchLocation } from "@/services/geocodingService.js";
import { cords } from "../utils/globalState.js";
import { getUserLocation, debounce } from "../utils/helpers.js";
import ErrorMessage from "./AlertMessage.vue";
import spinnerIcon from "./icons/IconLoadingSpinner.vue";

const MIN_QUERY_LENGTH = 3;
const ERROR_DISPLAY_MS = 3000;

//UI states
const query = ref("");
const suggestions = ref([]);
const searching = ref(false);
const isFocused = ref(false);

//Error handling variables
const errorText = ref("");
let errorTimer = null;

//Controls the ongoing search request to allow cancellation
//and prevent race conditions from outdated responses
let searchAbortController = null;

//Shows a temporary error message for 3 seconds
const showError = (msg) => {
  errorText.value = msg;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => {
    errorText.value = "";
  }, ERROR_DISPLAY_MS);
};

//Runs a location search, handling cancellation and shared error/loading state
const runSearch = async (text) => {
  searchAbortController?.abort();
  searchAbortController = new AbortController();

  searching.value = true;
  try {
    return await searchLocation(text, { signal: searchAbortController.signal });
  } catch (error) {
    if (error.name === "AbortError") return null;
    throw error;
  } finally {
    searching.value = false;
  }
};

//Fetches street suggestions while typing (with a 150ms delay)
const handleDestination = debounce(async () => {
  if (query.value.trim().length < MIN_QUERY_LENGTH) {
    suggestions.value = [];
    return;
  }

  try {
    const result = await runSearch(query.value);
    if (result !== null) suggestions.value = result;
  } catch (error) {
    showError("Could not connect to the search engine.");
    suggestions.value = [];
  }
}, 150);

//Updates global coordinates when a street suggestion is clicked
const selectDirection = (suggestion) => {
  const type = suggestion.tip_via || "";
  const portalNumber = suggestion.portalNumber
    ? ` ${suggestion.portalNumber}`
    : "";

  query.value = `${type} ${suggestion.address}${portalNumber}`.trim();
  suggestions.value = [];
  isFocused.value = false;

  cords.value = [parseFloat(suggestion.lat), parseFloat(suggestion.lng)];
};

//Handles the Enter key press in the search input
const handleEnter = async () => {
  const currentQuery = query.value.trim();

  //If input is empty, reset route
  if (currentQuery === "") {
    cords.value = null;
    return;
  }

  //Prevent searching with less than minimum characters
  if (currentQuery.length < MIN_QUERY_LENGTH) {
    showError("Please enter at least 3 characters.");
    return;
  }

  try {
    const resultData = await runSearch(currentQuery);
    if (resultData === null) return;

    if (resultData.length > 0) {
      selectDirection(resultData[0]);
    } else {
      showError("No street found with that name.");
    }
  } catch (error) {
    showError("Error searching for the street.");
  }
};

//Cleanup on component unmount
onBeforeUnmount(() => {
  searchAbortController?.abort();
  clearTimeout(errorTimer);
});
</script>

<template>
  <div class="relative w-full max-w-lg mx-auto pt-4 z-50">
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
          v-if="searching && isFocused && query.length >= MIN_QUERY_LENGTH"
          class="absolute right-3 top-3 text-gray-400"
        >
          <spinnerIcon />
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

    <div v-if="errorText" class="absolute w-full mt-2 z-50">
      <ErrorMessage :message="errorText" />
    </div>
  </div>
</template>
