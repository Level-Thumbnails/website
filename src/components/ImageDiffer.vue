<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  srcA: string;
  srcB?: string;
}>();

type ViewMode = 'a' | 'b' | 'side-by-side';

const viewMode = ref<ViewMode>(props.srcB ? 'side-by-side' : 'a');
const isZoomed = ref(false);
const zoomLevel = ref(1);
const zoomImage = ref<'a' | 'b' | null>(null);

const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imagePosition = ref({ x: 0, y: 0 });
const zoomContainerRef = ref<HTMLDivElement | null>(null);

const showImageA = computed(() => viewMode.value === 'a' || viewMode.value === 'side-by-side');
const showImageB = computed(() => viewMode.value === 'b' || viewMode.value === 'side-by-side');
const isSideBySide = computed(() => viewMode.value === 'side-by-side');

const hasBothImages = computed(() => props.srcB !== undefined);

const setViewMode = (mode: ViewMode) => {
  if (mode === 'b' && !hasBothImages.value) return;
  viewMode.value = mode;
};

const handleImageClick = (image: 'a' | 'b') => {
  if (isZoomed.value && zoomImage.value === image) {
    closeZoom();
  } else {
    zoomImage.value = image;
    isZoomed.value = true;
    zoomLevel.value = 1;
    imagePosition.value = { x: 0, y: 0 };
  }
};

const closeZoom = () => {
  isZoomed.value = false;
  zoomLevel.value = 1;
  zoomImage.value = null;
  imagePosition.value = { x: 0, y: 0 };
  isDragging.value = false;
};

const handleWheel = (event: WheelEvent) => {
  if (!isZoomed.value || !zoomContainerRef.value) return;
  event.preventDefault();

  const rect = zoomContainerRef.value.getBoundingClientRect();

  const mouseX = event.clientX - rect.left - rect.width / 2;
  const mouseY = event.clientY - rect.top - rect.height / 2;

  const zoomFactor = 1.15;
  const delta = event.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

  const oldScale = zoomLevel.value;
  const newScale = Math.max(0.5, Math.min(6, oldScale * delta));

  if (Math.abs(newScale - oldScale) < 0.0001) return;

  const localX = (mouseX - imagePosition.value.x) / oldScale;
  const localY = (mouseY - imagePosition.value.y) / oldScale;

  zoomLevel.value = newScale;

  imagePosition.value = {
    x: mouseX - localX * newScale,
    y: mouseY - localY * newScale
  };
};

const handleMouseDown = (event: MouseEvent) => {
  if (!isZoomed.value) return;
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - imagePosition.value.x,
    y: event.clientY - imagePosition.value.y,
  };
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !isZoomed.value) return;

  imagePosition.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y,
  };
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
};

const getZoomedImageSrc = computed(() => {
  if (!zoomImage.value) return '';
  return zoomImage.value === 'a' ? props.srcA : props.srcB || '';
});

const imageTransform = computed(() => {
  return `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) scale(${zoomLevel.value})`;
});
</script>

<template>
  <div class="w-100">
    <div class="image-differ">
      <div class="card-header">
        <h3 class="card-title">Preview</h3>
        <div class="controls" v-if="hasBothImages">
          <button class="btn-sm" :class="{
            'btn-primary': viewMode === 'a',
            'btn-secondary': viewMode !== 'a'
          }" @click="setViewMode('a')">
            New Thumbnail
          </button>
          <button class="btn-sm" :class="{
            'btn-primary': viewMode === 'b',
            'btn-secondary': viewMode !== 'b'
          }" @click="setViewMode('b')">
            Original Thumbnail
          </button>
          <button class="btn-sm" :class="{
            'btn-primary': viewMode === 'side-by-side',
            'btn-secondary': viewMode !== 'side-by-side'
          }" @click="setViewMode('side-by-side')">
            Side by Side
          </button>
        </div>
      </div>

      <div class="images-container" :class="{ 'side-by-side': isSideBySide }">
        <div v-if="showImageA" class="image-wrapper">
          <img :src="props.srcA" alt="New Thumbnail" @click="handleImageClick('a')" class="clickable" />
          <span class="image-label" v-if="hasBothImages">New Thumbnail</span>
        </div>
        <div v-if="showImageB && props.srcB" class="image-wrapper">
          <img :src="props.srcB" alt="Original Thumbnail" @click="handleImageClick('b')" class="clickable" />
          <span class="image-label" v-if="hasBothImages">Original Thumbnail</span>
        </div>
      </div>

      <div v-if="isZoomed" class="zoom-modal" @click="closeZoom" @wheel="handleWheel">
        <div class="zoom-content" @click.stop>
          <button class="close-button" @click="closeZoom">✕</button>
          <div class="zoom-info">
            Zoom: {{ Math.round(zoomLevel * 100) }}% | Scroll to zoom | Drag to pan
          </div>
          <div ref="zoomContainerRef" class="zoom-image-container" @mousedown="handleMouseDown"
            @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
            <img :src="getZoomedImageSrc" :alt="`Zoomed Image ${zoomImage?.toUpperCase()}`"
              :style="{ transform: imageTransform }" :class="{ dragging: isDragging }" @wheel="handleWheel"
              @dragstart.prevent />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-differ {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.images-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1.25rem;
}

.images-container.side-by-side {
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
}

.image-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 100%;
}

.images-container.side-by-side .image-wrapper {
  flex: 1;
  max-width: 50%;
}

.image-wrapper img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  max-width: 800px;
  max-height: 80vh;
  object-fit: contain;
}

.image-wrapper img.clickable {
  cursor: zoom-in;
  transition: opacity 0.2s;
}

.image-wrapper img.clickable:hover {
  opacity: 0.9;
}

.image-label {
  text-align: center;
  font-size: 0.9rem;
  color: #999;
  font-weight: 500;
}

.zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: zoom-out;
}

.zoom-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  cursor: default;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-button:hover {
  background: white;
}

.zoom-info {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 1001;
  color: #333;
}

.zoom-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.zoom-image-container {
  user-select: none;
}

.zoom-image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.12s ease-out;
}

.zoom-image-container img.dragging {
  cursor: grabbing;
  transition: none;
  overflow: hidden;
}

@media (max-width: 768px) {
  .images-container.side-by-side {
    flex-direction: column;
  }

  .images-container.side-by-side .image-wrapper {
    max-width: 100%;
  }

  .zoom-content {
    width: 100vw;
    height: 100vh;
  }

  .zoom-image-container {
    padding: 1rem;
  }
}
</style>