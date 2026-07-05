<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Chart, registerables, type ChartConfiguration} from 'chart.js';

Chart.register(...registerables);

const props = defineProps<{
  config: ChartConfiguration;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

function renderChart() {
  if (!canvasRef.value) return;

  chart?.destroy();
  chart = new Chart(canvasRef.value, {
    ...props.config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...props.config.options,
    },
  });
}

onMounted(renderChart);

watch(
  () => props.config,
  () => {
    if (chart) {
      chart.data = props.config.data;
      chart.options = { responsive: true, maintainAspectRatio: false, ...props.config.options };
      chart.update();
    } else {
      renderChart();
    }
  },
  { deep: true }
);

onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

canvas {
  display: block;
}
</style>