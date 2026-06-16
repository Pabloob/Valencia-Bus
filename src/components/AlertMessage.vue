<script setup>
let instanceCount = 0;

//Receives the error message to display from the parent component
const props = defineProps({
  message: String,
});

//Unique ID per instance so aria-labelledby points to a real element
const labelId = `error-message-label-${instanceCount++}`;
</script>

<template>
  <div
    class="bg-teal-50 border-t-2 border-red-600 rounded-lg p-4 dark:bg-red-800/70"
    role="alert"
    tabindex="-1"
    :aria-labelledby="labelId"
  >
    <div class="flex items-center">
      <div class="shrink-0">
        <span
          class="inline-flex justify-center items-center w-8 h-8 rounded-full border-4 border-red-100 bg-red-200 text-red-800 dark:border-red-900 dark:bg-red-800 dark:text-red-200"
        >
          <svg
            class="shrink-0 w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </span>
      </div>
      <div class="ms-3 text-sm text-foreground">
        <h3
          :id="labelId"
          class="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {{ message }}
        </h3>
      </div>
    </div>
  </div>
</template>
