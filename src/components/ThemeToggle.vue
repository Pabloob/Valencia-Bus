<script setup>
import { ref, watch, onMounted } from "vue";

//Load saved theme from localStorage, default to light
const theme = ref(localStorage.getItem("theme") || "light");

//Toggle between light and dark modes
const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

//Update DOM and save to localStorage when theme changes
watch(theme, (newTheme) => {
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

//Apply the theme when the component loads
onMounted(() => {
  document.documentElement.setAttribute("data-theme", theme.value);
});
</script>

<template>
  <label class="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      class="sr-only peer"
      :checked="theme === 'dark'"
      @change="toggleTheme"
    />
    <div
      class="relative w-11 h-6 bg-[var(--bg-input)] rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
    ></div>
  </label>
</template>
