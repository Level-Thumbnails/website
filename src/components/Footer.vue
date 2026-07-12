<script setup lang="ts">

</script>

<template>
  <footer class="footer">
    <div>
      <span class="me-1" style="color: #fff;">&copy; {{ new Date().getFullYear() }} Level Thumbnails</span>
      <a href="/swagger">Documentation</a>
      <router-link to="/privacy">Privacy</router-link>
      <router-link to="/terms">Terms</router-link>
    </div>
    <div class="footer-social">
      <a href="https://discord.gg/GuagJDsqds" aria-label="Discord" target="_blank" rel="noopener">
        <img src="/icons/discord.svg" alt="Discord" />
      </a>
      <a href="https://github.com/Level-Thumbnails/level-thumbs-mod" aria-label="GitHub" target="_blank" rel="noopener">
        <img src="/icons/github.svg" alt="GitHub" />
      </a>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px 48px;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.footer a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  margin-left: 24px;
  transition: color 0.3s ease;
}

.footer a:hover {
  color: rgba(126, 179, 255, 0.9);
}

.footer-social {
  display: flex;
  gap: 12px;
  box-sizing: border-box;
}

.footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #b4b0cc;
  transition: all 0.3s ease;
  margin-left: 0;
}

.footer-social a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: translateY(-2px);
}

.footer-social img {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .footer {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px;
  }

  .footer span {
    display: block;
    margin-bottom: 8px;
    margin-right: 0;
  }

  .footer a {
    margin-left: 0;
    margin-right: 16px;
  }

  .footer > div > a:last-child {
    margin-right: 0;
  }

  .footer-social {
    margin-top: 16px;
  }

  .footer-social a {
    width: 36px;
    height: 36px;
    margin-right: 0;
  }
}
</style>