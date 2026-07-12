<script setup lang="ts">
import {onMounted, ref} from 'vue';

const images = ref<string[][]>([]);
onMounted(() => {
  const rows = 5;
  const cols = 18;

  for (let r = 0; r < rows; r++) {
    const rowImages: string[] = [];
    for (let c = 0; c < cols; c++) {
      rowImages.push(`/thumbnail/random/small?r=${r}-${c}-${Math.floor(Math.random() * 1e6)}`);
    }
    images.value.push(rowImages);
  }
});
</script>

<template>
  <div class="mosaic-grid">
    <div class="mosaic-row" v-for="(row, rowIndex) in images" :key="rowIndex" :class="`r${rowIndex + 1}`">
      <div class="mosaic-item" v-for="(image, index) in row" :key="index">
        <img class="mosaic-item hidden" :src="image" alt="Mosaic Image" onload="this.classList.remove('hidden')" loading="lazy"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mosaic-grid {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  transform: skewY(-4deg) scale(1.1);
  transform-origin: top left;
}

.mosaic-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  width: max-content;
}

.r1 { animation: slideL 70s linear infinite; }
.r2 { animation: slideR 80s linear infinite; }
.r3 { animation: slideL 60s linear infinite; }
.r4 { animation: slideR 85s linear infinite; }
.r5 { animation: slideL 55s linear infinite; }

.mosaic-item {
  width: 180px;
  height: 110px;
  border-radius: 12px;
  flex-shrink: 0;
  opacity: 0.75;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mosaic-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(20%);
}

.mosaic-item.hidden {
  opacity: 0;
}

.mosaic-item:not(.hidden) {
  transition: opacity 1s ease-in-out;
}

@keyframes slideL { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes slideR { from { transform: translateX(-50%) } to { transform: translateX(0) } }

@media (max-width: 768px) {
  .mosaic-grid {
    transform: skewY(-4deg) scale(1.2);
    top: 20px;
  }
}
</style>