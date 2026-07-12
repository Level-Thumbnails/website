<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router'
import SessionManager from "../managers/session.ts";
import { fetchJson, unwrap } from "../lib/utils";
import type { StatsResponse } from "../lib/types";

import MosaicGrid from "../components/MosaicGrid.vue";
import Button from "../components/Button.vue";
import LazyCounter from "../components/LazyCounter.vue";
import Container from "../components/Container.vue";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";

const stats = ref({
  storage: 0,
  storage_size: "GB",
  thumbnails: 0,
  users_per_month: 0
});

function determineStorageUnit(size: number): string {
  if (size >= 1_000_000_000) return 'GB';
  if (size >= 1_000_000) return 'MB';
  if (size >= 1_000) return 'KB';
  return 'B';
}

function convertStorageSize(size: number): number {
  if (size >= 1_000_000_000) return size / 1_000_000_000;
  if (size >= 1_000_000) return size / 1_000_000;
  if (size >= 1_000) return size / 1_000;
  return size;
}

(async () => {
  try {
    const payload = await fetchJson('/stats');
    const data = unwrap<StatsResponse>(payload);

    const storageSize = (data.storage ?? 0) as number;
    stats.value.storage = convertStorageSize(storageSize);
    stats.value.storage_size = determineStorageUnit(storageSize);
    stats.value.thumbnails = (data.thumbnails ?? 0) as number;
    stats.value.users_per_month = (data.users_per_month ?? 0) as number;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
})();

const router = useRouter();

function trySignIn() {
  if (SessionManager.isAuthenticated()) {
    router.push('/dashboard');
  } else {
    SessionManager.beginDiscordAuth();
  }
}

onMounted(() => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

</script>

<template>
  <div class="background-wrapper">
    <MosaicGrid class="mosaic-grid"/>
    <div class="glow-1"/>
    <div class="glow-2"/>
    <div class="glow-3"/>
  </div>
  <Header/>
  <main>
    <Container class="main-container mt-4 px-2">
      <div class="hero-main reveal">
        <h1 class="title-gradient">Level Thumbnails</h1>
        <p class="hero-description">
          Largest community-driven database of Geometry Dash level thumbnail images with Geode mod integration.
        </p>
        <div class="d-flex gap-1 buttons-container">
          <Button url="https://geode-sdk.org/mods/cdc.level_thumbnails" newTab>
            Install on Geode
          </Button>
          <Button @click="trySignIn()" isDark >
            {{ (SessionManager.isAuthenticated() ? "Open Dashboard" : "Sign In")}}
          </Button>
        </div>
      </div>
      <div class="hero-sub reveal delay-2 text-right">
        <img src="/logo.webp" alt="Hero Image" style="height: auto;"/>
      </div>
    </Container>
    <Container class="text-center stats-grid">
      <div class="stat-item reveal delay-1">
        <img src="/storage.svg"/>
        <div>
          <strong>
            <LazyCounter :value="stats.storage" :decimals="1"/>
            {{ stats.storage_size }}
          </strong>
          Image data stored
        </div>
      </div>
      <div class="stat-item reveal delay-2">
        <img src="/logo.svg"/>
        <div>
          <strong>
            <LazyCounter :value="stats.thumbnails"/>
          </strong>
          Levels with thumbnails
        </div>
      </div>
      <div class="stat-item reveal delay-3">
        <img src="/user.svg"/>
        <div>
          <strong>
            <LazyCounter :value="stats.users_per_month / 1_000_000" :decimals="2"/>M
          </strong>
          Unique users per month
        </div>
      </div>
    </Container>

    <div class="divider reveal" id="features"></div>

    <Container class="feature-showcase reveal">
      <div class="showcase-header text-center">
        <h2>Features</h2>
        <p>See how Level Thumbnails improves your Geometry Dash experience</p>
      </div>

      <div class="dynamic-showcase-layout">
        <div class="showcase-row reveal delay-1">
          <div class="showcase-visual skew-left">
            <img src="/screenshots/screenshot_1.webp" alt="Level lists integration"/>
          </div>
          <div class="showcase-content">
            <span class="feature-badge badge-pink">01 / Thumbnails </span>
            <h3>Level Lists Integration</h3>
            <p>Browse online level menus with instant, high-quality visual context right in your list view. No more guessing what a level looks like before playing it.</p>
          </div>
        </div>

        <div class="showcase-row reverse reveal delay-2">
          <div class="showcase-content">
            <span class="feature-badge badge-blue">02 / Integration</span>
            <h3>Works Everywhere</h3>
            <p>Provides visual content in every place you would expect. Works with Daily/Weekly/Event levels same way as everywhere else.</p>
          </div>
          <div class="showcase-visual skew-right">
            <img src="/screenshots/screenshot_2.webp" alt="Works Everywhere"/>
          </div>
        </div>

        <div class="showcase-row reveal delay-3">
          <div class="showcase-visual skew-left">
            <img src="/screenshots/screenshot_3.webp" alt="Better Level Pages"/>
          </div>
          <div class="showcase-content">
            <span class="feature-badge badge-purple">03 / Background</span>
            <h3>Better Level Pages</h3>
            <p>
              The mod also allows you to customize the level page by displaying the image as a full-sized background.
              Configurable blur options make it look great with any level.
            </p>
          </div>
        </div>

        <div class="showcase-row reverse reveal delay-4">
          <div class="showcase-content">
            <span class="feature-badge badge-gold">04 / Community</span>
            <h3>In-Game Thumbnail Taking</h3>
            <p>
              Level doesn't have a thumbnail? No problem! You can take a thumbnail in-game and submit it to the database directly from the mod.
            </p>
          </div>
          <div class="showcase-visual skew-right">
            <img src="/screenshots/screenshot_4.webp" alt="In-Game Thumbnail Taking"/>
          </div>
        </div>
      </div>
    </Container>

    <Container class="community text-center reveal">
      <h2>Join the Community</h2>
      <p>
        Join our Discord server to connect with other Geometry Dash players, share your level thumbnails, and get support.
      </p>
      <Button url="https://discord.gg/GuagJDsqds" newTab>
        Join Discord
      </Button>
    </Container>
  </main>
  <Footer/>
</template>

<style scoped>
:global(:root) {
  background: rgba(11, 10, 23, 1.0) !important;
}

.main-container {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  margin-top: 60px;
  padding-top: 160px;
  padding-bottom: 160px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.title-gradient {
  background: linear-gradient(100deg, #d9acbf, #c0daf8, #fde7c7, #c0daf8, #d9acbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 4em;
  animation: gradientAnimation 6s linear infinite;
  background-size: 200% auto;
  line-height: normal;
}

@keyframes gradientAnimation {
  to {
    background-position: -200% center;
  }
}

.hero-description {
  font-size: 1.2em;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-family: "Inter", sans-serif;
  margin: 20px 0 40px;
}

.buttons-container {
  flex-wrap: wrap;
}

.mosaic-grid {
  z-index: -1;
}

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in {
  opacity: 1;
  transform: translateY(0);
}

.delay-1 {
  transition-delay: 0.1s;
}

.delay-2 {
  transition-delay: 0.2s;
}

.delay-3 {
  transition-delay: 0.3s;
}

.delay-4 {
  transition-delay: 0.4s;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1000px;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.background-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
      180deg,
      rgba(11, 10, 23, 0.5) 0%,
      rgba(11, 10, 23, 0.8) 40%,
      rgba(11, 10, 23, 1.0) 80%
  );
  z-index: 2;
}

.glow-1, .glow-2, .glow-3 {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 3;
  opacity: 0.6;
}

.glow-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  left: -200px;
  background: rgba(255, 61, 138, 0.2);
}

.glow-2 {
  width: 500px;
  height: 500px;
  top: 100px;
  right: -200px;
  background: rgba(63, 169, 255, 0.15);
}

.glow-3 {
  width: 500px;
  height: 500px;
  top: 300px;
  left: 20%;
  background: rgba(139, 92, 246, 0.15);
}

h1 {
  font-size: 4.5em;
  margin: 20px 0;
}

h2 {
  font-size: 2.5em;
  margin: 20px 0;
}

@media (max-width: 1200px) {
  h1 {
    font-size: 3.5em;
  }

  h2 {
    font-size: 2em;
  }

  .main-container {
    grid-template-columns: 2fr 1fr;
    gap: 12px;
  }
}

@media (max-width: 800px) {
  h1 {
    font-size: 3em;
  }

  h2 {
    font-size: 1.8em;
  }

  .main-container {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .buttons-container {
    justify-content: center;
  }

  .hero-sub {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr !important;
    gap: 16px;
    padding: 0 16px 40px 16px;
  }
}

p {
  font-size: 1.1em;
  margin: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 0 32px 40px 32px;
  box-sizing: border-box;
}

.stat-item {
  background: rgba(29, 29, 65, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px 28px;
  text-align: left;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  display: flex;
  gap: 16px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  flex-direction: column;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  font-family: "Inter", sans-serif;
}

.stat-item:nth-child(1) {
  border-color: rgba(255,61,138,0.45);
  background:linear-gradient(160deg, rgba(255,61,138,0.14), rgba(255,255,255,0.04));
}

.stat-item:nth-child(2) {
  border-color: rgba(63,169,255,0.45);
  background:linear-gradient(160deg, rgba(63,169,255,0.14), rgba(255,255,255,0.04));
}

.stat-item:nth-child(3) {
  border-color: rgba(139,92,246,0.45);
  background:linear-gradient(160deg, rgba(139,92,246,0.16), rgba(255,255,255,0.04));
}

.stat-item strong {
  font-size: 2.2em;
  font-weight: bold;
  font-family: "Alata", system-ui, Avenir, Helvetica, Arial, sans-serif;
  display: block;
}

.stat-item img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
}

.feature-showcase {
  padding: 80px 32px;
  box-sizing: border-box;
}

.showcase-header {
  margin-bottom: 64px;
}

.dynamic-showcase-layout {
  display: flex;
  flex-direction: column;
  gap: 80px;
}

.showcase-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 48px;
  align-items: center;
}

.showcase-row.reverse {
  grid-template-columns: 0.8fr 1.2fr;
}

.showcase-visual {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(29, 29, 65, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  perspective: 1000px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s;
}

.skew-left {
  transform: rotateY(10deg) rotateX(6deg) scale(0.98);
  animation: wobbleSkewLeft 4s ease-in-out infinite;
}

.skew-right {
  transform: rotateY(-10deg) rotateX(6deg) scale(0.98);
  animation: wobbleSkewRight 4s ease-in-out infinite;
  animation-delay: 0.2s;
}

@keyframes wobbleSkewLeft {
  0%, 100% { transform: rotateY(10deg) rotateX(6deg); }
  50% { transform: rotateY(12deg) rotateX(8deg); }
}

@keyframes wobbleSkewRight {
  0%, 100% { transform: rotateY(-10deg) rotateX(6deg); }
  50% { transform: rotateY(-12deg) rotateX(8deg); }
}

.showcase-visual img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-content {
  font-family: "Inter", sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-badge {
  font-size: 0.8em;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.badge-pink { color: #ff3d8a; }
.badge-blue { color: #3fa9ff; }
.badge-purple { color: #8b5cf6; }
.badge-gold { color: #fde7c7; }

.showcase-content h3 {
  font-size: 2em;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 16px 0;
  font-family: "Alata", sans-serif;
}

.showcase-content p {
  font-size: 1.1em;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
}

.showcase-visual:hover {
  transform: rotateY(0deg) rotateX(0deg) scale(1.02) !important;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.showcase-visual:hover img {
  transform: scale(1.02);
}

@media (max-width: 960px) {
  .showcase-row, .showcase-row.reverse {
    grid-template-columns: 1fr;
    gap: 24px;
    text-align: center;
  }

  .showcase-row.reverse .showcase-content {
    order: 2;
  }

  .skew-left, .skew-right {
    transform: none !important;
  }

  .showcase-visual:hover {
    transform: scale(1.02);
  }
}

.community {
  padding: 40px 32px;
  background: rgba(29, 29, 65, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  margin-bottom: 64px;
}

.divider {
  height: 1px;
  width: 80%;
  max-width: 1200px;
  margin: 100px auto 0 auto;
  background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(192, 218, 248, 0.4) 30%,
      #ff3d8a 50%,
      rgba(63, 169, 255, 0.4) 70%,
      rgba(255, 255, 255, 0) 100%
  );
}
</style>