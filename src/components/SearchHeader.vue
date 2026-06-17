<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import SwitchTheme from "./ThemeToggle.vue";
import { searchLocation } from "@/services/geocodingService.js";
import {
  originCords,
  destinyCords,
  originMode,
  gpsCords,
  resetRoute,
} from "../utils/globalState.js";
import { debounce } from "../utils/helpers.js";
import ErrorMessage from "./AlertMessage.vue";
import spinnerIcon from "./icons/IconLoadingSpinner.vue";

const MIN_QUERY_LENGTH = 3;
const ERROR_DISPLAY_MS = 3000;
const GPS_LABEL = "Tu ubicación";

//UI state per input. originMode (global) is the source of truth for
//whether the origin is GPS-based; this label is purely cosmetic.
const queryOrigin = ref("");
const queryDestiny = ref("");
const suggestions = ref([]);
const searching = ref(false);
const activeInput = ref(null);

//Whether the origin input should currently render as the GPS label
const isShowingGpsLabel = computed(
  () => originMode.value === "gps" && activeInput.value !== "origin",
);

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
  const currentController = new AbortController();
  searchAbortController = currentController;

  searching.value = true;
  try {
    return await searchLocation(text, { signal: searchAbortController.signal });
  } catch (error) {
    if (error.name === "AbortError") return null;
    throw error;
  } finally {
    if (searchAbortController === currentController) {
      searching.value = false;
    }
  }
};

//Fetches street suggestions while typing (with a 150ms delay)
const handleSearch = debounce(async () => {
  const currentQuery =
    activeInput.value === "origin" ? queryOrigin.value : queryDestiny.value;

  if (currentQuery.trim().length < MIN_QUERY_LENGTH) {
    suggestions.value = [];
    return;
  }

  try {
    const result = await runSearch(currentQuery);
    if (result !== null) suggestions.value = result;
  } catch (error) {
    showError("No se ha podido conectar con el buscador.");

    // suggestions.value = [];
  }
}, 500);

//Origin input uses a manual value/@input binding (instead of v-model)
//because its displayed value depends on isShowingGpsLabel, not just
//on queryOrigin directly.
const handleOriginInput = (event) => {
  queryOrigin.value = event.target.value;
  handleSearch();
};

//Sets the active input when user clicks on it
const setActiveInput = (type) => {
  activeInput.value = type;
  suggestions.value = [];
};

//Updates global coordinates when a street suggestion is clicked
const selectDirection = (suggestion) => {
  searchAbortController?.abort();

  const type = suggestion.tip_via || "";
  const portalNumber = suggestion.portalNumber
    ? ` ${suggestion.portalNumber}`
    : "";
  const fullAddress = `${type} ${suggestion.address}${portalNumber}`.trim();
  const coords = [parseFloat(suggestion.lat), parseFloat(suggestion.lng)];

  if (activeInput.value === "origin") {
    queryOrigin.value = fullAddress;
    originCords.value = coords;
    originMode.value = "manual";
  } else {
    queryDestiny.value = fullAddress;
    destinyCords.value = coords;
  }
  suggestions.value = [];
};

//If origin is left empty after editing, restore the real GPS location
//(from gpsCords, not the possibly-stale originCords) when available.
//Otherwise the input stays empty with the "Selecciona tu origen"
//placeholder, instead of dishonestly claiming a location we don't have.
const handleOriginBlur = () => {
  if (activeInput.value === "origin") activeInput.value = null;
  setTimeout(() => {
    suggestions.value = [];
    if (queryOrigin.value.trim() !== "") return;

    if (gpsCords.value) {
      originCords.value = gpsCords.value;
      originMode.value = "gps";
    } else {
      originCords.value = null;
      originMode.value = null;
    }
  }, 200);
};

//Clears suggestions when clicking outside
const handleDestinyBlur = () => {
  if (activeInput.value === "destiny") activeInput.value = null;
  setTimeout(() => {
    suggestions.value = [];
  }, 200);
};

//Handles the Enter key press in the search input
const handleEnter = async () => {
  const currentQuery =
    activeInput.value === "origin"
      ? queryOrigin.value.trim()
      : queryDestiny.value.trim();

  //If input is empty, reset route
  if (currentQuery === "") {
    if (activeInput.value === "destiny") resetRoute();
    return;
  }

  //Prevent searching with less than minimum characters
  if (currentQuery.length < MIN_QUERY_LENGTH) {
    showError("Por favor, escribe al menos 3 caracteres.");
    return;
  }

  try {
    const resultData = await runSearch(currentQuery);
    if (resultData === null) return;

    if (resultData.length > 0) {
      selectDirection(resultData[0]);
    } else {
      showError("No se ha encontrado ninguna calle con ese nombre.");
    }
  } catch (error) {
    showError("Error al buscar la calle.");
  }
};

//Cleanup on component unmount
onBeforeUnmount(() => {
  searchAbortController?.abort();
  clearTimeout(errorTimer);
});
</script>

<template>
  <div class="relative w-full max-w-lg mx-auto pt-4 z-50 px-4">
    <div class="flex items-start gap-4">
      <div
        class="relative flex-1 bg-white rounded-xl shadow-md border border-gray-100 p-2"
      >
        <div
          class="absolute left-6 top-5 bottom-5 w-0.5 flex flex-col items-center justify-between z-10"
        >
          <div
            class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white -ml-[5px]"
          ></div>
          <div
            class="w-3 h-3 bg-red-500 rounded-full border-2 border-white -ml-[5px]"
          ></div>
        </div>

        <div class="relative mb-2">
          <input
            id="origin"
            name="origin"
            :value="isShowingGpsLabel ? GPS_LABEL : queryOrigin"
            @input="handleOriginInput"
            @focus="setActiveInput('origin')"
            @blur="handleOriginBlur"
            @keydown.enter.prevent="handleEnter"
            type="text"
            placeholder="Selecciona tu origen"
            :class="[
              'w-full pl-10 pr-10 py-2 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm',
              isShowingGpsLabel ? 'text-blue-600 font-medium' : 'text-gray-700',
            ]"
          />
          <div
            v-if="searching && activeInput === 'origin'"
            class="absolute right-3 top-2.5 text-gray-400"
          >
            <spinnerIcon class="w-4 h-4" />
          </div>
          <div
            v-if="isShowingGpsLabel"
            class="absolute right-3 top-2.5 text-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-4 h-4"
            >
              <path
                fill-rule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div class="h-px bg-gray-100 ml-10 mr-2 mb-2"></div>

        <div class="relative">
          <input
            id="destiny"
            name="destiny"
            v-model="queryDestiny"
            @input="handleSearch"
            @focus="setActiveInput('destiny')"
            @blur="handleDestinyBlur"
            @keydown.enter.prevent="handleEnter"
            type="text"
            placeholder="¿Dónde quieres ir?"
            class="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm text-gray-700"
          />
          <div
            v-if="searching && activeInput === 'destiny'"
            class="absolute right-3 top-2.5 text-gray-400"
          >
            <spinnerIcon class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 mt-3">
        <SwitchTheme />
      </div>
    </div>

    <div
      v-if="suggestions.length > 0 && activeInput"
      class="absolute left-4 right-16 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
    >
      <ul class="max-h-60 overflow-y-auto">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @mousedown.prevent="selectDirection(suggestion)"
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 text-gray-400 shrink-0"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <div>
            <div class="text-sm font-medium text-gray-800">
              {{ suggestion.tip_via }} {{ suggestion.address }}
              {{ suggestion.portalNumber }}
            </div>
            <div class="text-xs text-gray-500">
              {{ suggestion.municipality || "Valencia" }}
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-if="errorText" class="absolute w-full mt-2 z-50">
      <ErrorMessage :message="errorText" />
    </div>
  </div>
</template>
