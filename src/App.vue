<template>
  <TopBar />
  <BusMap />
</template>

<script>
import BusMap from "./components/busMap.vue";
import TopBar from "./components/topBar.vue";

export default {
  name: "App",
  components: {
    TopBar,
    BusMap,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
