<script setup lang="ts">
import {onMounted, ref} from 'vue';

const images = ref<string[][]>([]);
onMounted(() => {
  const imageUrls = [];
  for (let i = 1; i <= 25; i++) {
    imageUrls.push(`/thumbnail/random/small?t=${i}`);
  }
  for (let i = 0; i < 3; i++) {
    images.value.push(imageUrls.slice(i * 5, i * 5 + 5));
  }
});

</script>

<template>
  <div class="mosaic-grid">
    <div class="mosaic-row" v-for="(row, rowIndex) in images" :key="rowIndex"
         :style="`--speed: ${Math.random() * 20 + 35}s`">
      <div class="mosaic-track" :style="`--reverse: ${rowIndex % 2 === 0 ? 'normal' : 'reverse'}`">
        <img class="mosaic-item hidden" v-for="(image, index) in row" :key="index" :src="image" alt="Mosaic Image"
             onload="this.classList.remove('hidden')"/>
        <img class="mosaic-item hidden" v-for="(image, index) in row" :key="index" :src="image" alt="Mosaic Image"
             onload="this.classList.remove('hidden')"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mosaic-row {
  overflow: hidden;
  white-space: nowrap;
  margin-bottom: 40px;
  height: 180px;
}

.mosaic-track {
  display: flex;
  gap: 30px;
  animation-name: slide;
  animation-duration: var(--speed, 20s);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-direction: var(--reverse, normal);
  animation-play-state: running;
  will-change: transform;
  width: calc(10 * 320px + 9 * 30px); /* 5 images + 4 gaps * 2 for duplication */
}

.mosaic-item {
  display: inline-block;
  object-fit: cover;
  width: 320px;
  border-radius: 8px;
}

.mosaic-item.hidden {
  opacity: 0;
}

.mosaic-item:not(.hidden) {
  opacity: 0.5;
  transition: opacity 1s ease-in-out;
}

@keyframes slide {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>