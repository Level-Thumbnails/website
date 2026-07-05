<script setup lang="ts">
import {ref} from 'vue';
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

const CLIENT_ID = "1398022313877704764";
const REDIRECT_URI = `${window.location.origin}/auth/discord`;
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;

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
    window.location.href = DISCORD_AUTH_URL;
  }
}

</script>

<template>
  <Header/>
  <main>
    <Container class="main-container mt-4 text-center">
      <MosaicGrid class="mosaic-grid"/>
      <div class="inner">
        <div class="backdrop">
          <h1>Level Thumbnails</h1>
          <p>
            <Button url="https://geode-sdk.org/mods/cdc.level_thumbnails" newTab>
              Install on Geode
            </Button>
          </p>
          <p>
            <Button @click="trySignIn()" isDark>
              {{ (SessionManager.isAuthenticated() ? "Open Dashboard" : "Sign In")}}
            </Button>
          </p>
        </div>
      </div>
    </Container>
    <div class="dark-bg mt-4">
      <Container class="text-center">
        <h2>Statistics</h2>
        <div class="stats-container">
          <div class="stat-item">
            <img src="/storage.svg"/>
            <strong>
              <LazyCounter :value="stats.storage" :decimals="1"/>
              {{ stats.storage_size }}
            </strong>
            of images stored
          </div>
          <div class="stat-item">
            <img src="/logo.svg"/>
            <strong>
              <LazyCounter :value="stats.thumbnails"/>
            </strong>
            levels with thumbnails
          </div>
          <div class="stat-item">
            <img src="/user.svg"/>
            <strong>
              <LazyCounter :value="stats.users_per_month / 1_000_000" :decimals="2"/>
              million
            </strong>
            unique users per month
          </div>
        </div>
      </Container>
    </div>
  </main>
  <Footer/>
</template>

<style scoped>
.main-container {
  height: calc(3 * 180px + 2 * 40px);
  display: table;
  position: relative;
  margin-top: 20px;
  width: 100%;
}

.mosaic-grid {
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  position: absolute;
  z-index: -1;
}

.inner {
  display: table-cell;
  vertical-align: middle;
}

.backdrop {
  margin: 0 auto;
  max-width: 60%;
  background: linear-gradient(rgba(29, 29, 65, 0.5), rgba(51, 51, 110, 0.05));
  backdrop-filter: blur(12px);
  padding: 20px;
  border-radius: 24px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  .backdrop {
    max-width: 80%;
  }

  h1 {
    font-size: 3.5em;
  }

  h2 {
    font-size: 2em;
  }
}

@media (max-width: 800px) {
  .backdrop {
    max-width: 80%;
  }

  h1 {
    font-size: 3em;
  }

  h2 {
    font-size: 1.8em;
  }
}

p {
  font-size: 1.1em;
  margin: 20px 0;
}

.dark-bg {
  background-color: rgba(29, 29, 65, 0.6);
  color: white;
  padding: 40px 0;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-item {
  flex: 1;
  min-width: 200px;
  text-align: center;
  margin: 20px;
}

.stat-item strong {
  font-size: 2em;
  display: block;
}

.stat-item img {
  width: 144px;
  height: 144px;
  margin-bottom: 10px;
}
</style>