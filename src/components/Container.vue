<template>
  <div class="container">
    <slot></slot>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .container {
    max-width: 100%;
  }
}

@media (max-width: 800px) {
  .container {
    max-width: 100%;
  }
}
</style>