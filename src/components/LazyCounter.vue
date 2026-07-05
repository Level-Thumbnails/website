<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, watch, type Ref} from 'vue';

function useInView(targetRef: Ref<Element | null>, options: IntersectionObserverInit = {}) {
  const isVisible = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true;
        observer?.disconnect();
      }
    }, options);
    if (targetRef.value) observer.observe(targetRef.value);
  });

  onBeforeUnmount(() => observer?.disconnect());

  return {isVisible};
}

function animateCounter(
    start: number,
    end: number,
    duration: number = 1000,
    onUpdate: (value: number) => void = () => {
    }
) {
  let startTime: number | null = null;

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = start + (end - start) * progress;
    onUpdate(value);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

const props = defineProps<{
  value: number;
  duration?: number;
  decimals?: number;
}>();

const counter = ref(0);
const statSection = ref<HTMLElement | null>(null);
const {isVisible} = useInView(statSection, {threshold: 0.1});

// We use a single watch for visibility and value changes
watch(isVisible, (visible) => {
  if (visible) {
    animateCounter(counter.value, props.value, props.duration || 1000, (value) => {
      counter.value = value;
    });
  }
});

// Re-animate if `value` changes while visible
watch(() => props.value, (newValue) => {
  if (isVisible.value) {
    animateCounter(counter.value, newValue, props.duration || 1000, (value) => {
      counter.value = value;
    });
  }
});
</script>

<template>
  <span ref="statSection" class="counter">
    {{
      counter.toLocaleString(undefined, {
        minimumFractionDigits: props.decimals ?? 0,
        maximumFractionDigits: props.decimals ?? 0
      })
    }}
  </span>
</template>