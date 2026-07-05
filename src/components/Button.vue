<script setup lang="ts">
const props = defineProps<{
  url?: string;
  isDark?: boolean;
  newTab?: boolean;
}>();

defineEmits(['click']);
</script>

<template>
  <a :href="props.url" :target="props.newTab && '_blank' || undefined" :class="{ 'dark-button': props.isDark }"
     @click="$emit('click')">
    <slot></slot>
  </a>
</template>

<style scoped>
a {
  font-family: "Afacad", "Alata", system-ui, Avenir, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: black;
  border: 2px solid #000000;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 1.2em;
  transition: transform 0.2s ease;
  min-width: 220px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.dark-button {
  background-color: #000000;
  color: #ffffff;
  border-color: #ffffff;
}

a:hover {
  transform: scale(1.1);
}

a:active {
  transform: scale(1.05);
}
</style>