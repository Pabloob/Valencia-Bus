<script setup>
defineProps({
  size: { type: String, default: "16" },
  colorClass: { type: String, default: "text-gray-400" },
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="colorClass"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
</template>