<template>
  <div
    class="bg-[var(--bg-main)] text-[var(--text-main)] mt-[0] min-h-screen transition-colors duration-300 ease-in-out"
  >
    <TopBar />
    <BusMap />
  </div>
</template>

<script>
import BusMap from "./components/BusMap.vue";
import TopBar from "./components/SearchHeader.vue";

export default {
  name: "App",
  components: {
    TopBar,
    BusMap,
  },
};
</script>
