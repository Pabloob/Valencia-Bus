<script setup>
import leftIcon from './icons/IconArrowLeft.vue';

defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="relative group">
    <button
      class="w-full flex items-center justify-between gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none cursor-default"
    >
      <leftIcon />
      {{ title }}
    </button>
    <div
      class="absolute right-full top-0 mr-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 min-w-40 bg-white border border-gray-200 rounded-lg shadow-lg"
    >
      <div class="p-1 space-y-0.5">
        <a
          v-for="item in items"
          :key="item.value"
          class="block py-2 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
          href="#"
          @click.prevent="emit('select', item.value)"
          >{{ item.label }}</a
        >
      </div>
    </div>
  </div>
</template>