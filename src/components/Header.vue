<script setup lang="ts">
</script>

<template>
  <header class="header">
    <img src="/logo.webp" alt="Level Thumbnails Logo"/>
  </header>
</template>

<style scoped>
.header {
  text-align: center;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.5);
}

.header img {
  width: 64px;
  height: 64px;
}

.header img:hover {
  transform: scale(1.1);
  transition: transform 0.3s ease;
}

.header img:active {
  transform: scale(1);
}

.header img:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.header img:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}
</style>