<script setup lang="ts">
const props = defineProps<{
  size?: number;
  backdrop?: boolean;
}>();

const style = {
  width: props.size ? `${props.size}px` : '6em',
};

</script>

<template>
  <div v-if="props.backdrop" class="backdrop">
    <img src="/loading.svg" :style="style" alt="Loading..."/>
  </div>
  <img v-else src="/loading.svg" :style="style" alt="Loading..."/>
</template>

<style scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

img {
  display: block;
  margin: 0 auto;
  animation: spin 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) infinite;
  will-change: transform;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  85% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>