<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { fetchJson, unwrap } from "../lib/utils";
import type { Period, TopLevelStatWithInfo } from "../lib/types";

import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import Container from "../components/Container.vue";
import LoadingCircle from "../components/LoadingCircle.vue";
import DifficultyFace from "../components/DifficultyFace.vue";
import LazyCounter from "../components/LazyCounter.vue";

type PeriodOption = {
  key: Period;
  label: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'day', label: '24 hours' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
];

function readInitialPeriod(): Period {
  const fromHash = window.location.hash.replace('#', '').toLowerCase();
  const candidates: Period[] = ['day', 'week', 'month'];
  if (fromHash && candidates.includes(fromHash as Period)) return fromHash as Period;
  return 'day';
}

const selectedPeriod = ref<Period>(readInitialPeriod());
const levels = ref<TopLevelStatWithInfo[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const error = ref<string | null>(null);
const activeLevelId = ref<number | null>(null);

async function loadData(period: Period, isRefresh = false) {
  if (isRefresh) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;
  activeLevelId.value = null;
  try {
    const payload = await fetchJson(`/stats/levels?period=${period}`);
    const data = unwrap<TopLevelStatWithInfo[]>(payload);
    levels.value = Array.isArray(data) ? data : [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    error.value = msg || 'Failed to load popular levels.';
    levels.value = [];
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function selectPeriod(period: Period) {
  if (period === selectedPeriod.value) return;
  selectedPeriod.value = period;
  if (window.history.replaceState) {
    window.history.replaceState(null, '', `#${period}`);
  }
  loadData(period, true);
}

let revealObserver: IntersectionObserver | null = null;

onMounted(() => {
  loadData(selectedPeriod.value);
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver?.observe(el));
  });
});

watch([levels, loading], () => {
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => revealObserver?.observe(el));
  });
});

const featured = computed(() => levels.value[0] || null);
const rest = computed(() => levels.value.slice(1));

function levelDisplayName(l: TopLevelStatWithInfo): string {
  return l.level_name?.trim() || `Level ${l.level_id}`;
}

function creatorDisplayName(l: TopLevelStatWithInfo): string {
  return l.creator_name?.trim() || 'Unknown';
}

function levelUrl(l: TopLevelStatWithInfo): string {
  return `https://gdbrowser.com/${l.level_id}`;
}

function creatorUrl(l: TopLevelStatWithInfo): string | undefined {
  return l.creator_id ? `https://gdbrowser.com/u/${l.creator_id}` : undefined;
}

function rankSuffix(rank: number): string {
  if (rank >= 4 && rank <= 20) return 'th';

  const lastDigit = rank % 10;
  if (lastDigit === 1) return 'st';
  if (lastDigit === 2) return 'nd';
  if (lastDigit === 3) return 'rd';

  return 'th';
}

function isPlatformer(l: TopLevelStatWithInfo): boolean {
  return l.length === 'Plat';
}

function openLevel(l: TopLevelStatWithInfo) {
  activeLevelId.value = l.level_id;
  document.body.style.overflow = 'hidden';
}

function closeLevel() {
  activeLevelId.value = null;
  document.body.style.overflow = '';
}

function activeLevel() {
  if (activeLevelId.value === null) return null;
  return levels.value.find(l => l.level_id === activeLevelId.value) || null;
}

function formatRequests(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
</script>

<template>
  <div class="background-wrapper">
    <div class="glow-1"/>
    <div class="glow-2"/>
    <div class="glow-3"/>
  </div>
  <Header/>
  <main>
    <Container class="hero-section px-2">
      <h1 class="title-gradient reveal delay-1">Popular Levels</h1>
      <p class="hero-description reveal delay-2">
        The most-played levels in Geometry Dash right now, ranked by how often players
        are pulling their thumbnails through the mod.
      </p>
      <div class="period-selector reveal delay-2" role="tablist" aria-label="Select time period">
        <button
            v-for="opt in PERIOD_OPTIONS"
            :key="opt.key"
            type="button"
            role="tab"
            :aria-selected="selectedPeriod === opt.key"
            :class="['period-btn', { active: selectedPeriod === opt.key }]"
            @click="selectPeriod(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
    </Container>

    <Container v-if="loading" class="loading-state px-2">
      <LoadingCircle :size="80"/>
      <p class="loading-text">Crunching the latest numbers…</p>
    </Container>

    <Container v-else-if="error" class="px-2">
      <div class="error-card">
        <h3>Couldn't load popular levels</h3>
        <p class="error-message">{{ error }}</p>
      </div>
    </Container>

    <template v-else-if="levels.length > 0">
      <div class="content-wrap" :class="{ refreshing: refreshing }">
        <Container v-if="featured" class="featured-section px-2">
          <div class="featured-card reveal delay-1" @click="openLevel(featured)">
            <div class="featured-thumb">
              <img
                  :src="`/thumbnail/${featured.level_id}/small`"
                  :alt="levelDisplayName(featured)"
                  loading="lazy"
                  @error="(e) => (e.target as HTMLImageElement).style.opacity = '0'"
                  @load="(e) => (e.target as HTMLImageElement).classList.add('loaded')"
              />
              <div class="thumb-overlay">
                <span class="view-hint">View Details</span>
              </div>
              <div class="rank-badge">
                <span class="rank-num">1</span><sup>{{ rankSuffix(1) }}</sup>
              </div>
            </div>

            <div class="featured-info">
              <div class="featured-header">
                <DifficultyFace
                    :difficulty="(featured.difficulty || 'NA') as any"
                    :stars="0"
                    :rate="(featured.rating || 'NA') as any"
                    :moons="isPlatformer(featured)"
                    :size="56"
                />
                <div class="featured-titles">
                  <a :href="levelUrl(featured)" target="_blank" rel="noopener" class="featured-name" @click.stop>
                    {{ levelDisplayName(featured) }}
                  </a>
                  <a v-if="creatorUrl(featured)" :href="creatorUrl(featured)" target="_blank" rel="noopener"
                     class="featured-creator" @click.stop>
                    by {{ creatorDisplayName(featured) }}
                  </a>
                  <span v-else class="featured-creator">by {{ creatorDisplayName(featured) }}</span>
                </div>
              </div>

              <div class="featured-stats">
                <div class="featured-requests">
                  <span class="requests-num">
                    <LazyCounter :value="featured.requests"/>
                  </span>
                  <span class="requests-label">requests</span>
                </div>
              </div>
            </div>
          </div>
        </Container>

        <Container v-if="rest.length > 0" class="grid-section px-2">
          <div class="level-grid">
            <button
                v-for="(level, idx) in rest"
                :key="level.level_id"
                type="button"
                class="level-card reveal"
                :style="{ transitionDelay: `${Math.min(idx * 0.05, 0.4)}s` }"
                @click="openLevel(level)"
            >
              <div class="card-thumb">
                <img
                    :src="`/thumbnail/${level.level_id}/small`"
                    :alt="levelDisplayName(level)"
                    loading="lazy"
                    @error="(e) => (e.target as HTMLImageElement).style.opacity = '0'"
                    @load="(e) => (e.target as HTMLImageElement).classList.add('loaded')"
                />
                <div class="thumb-overlay">
                  <span class="view-hint">View</span>
                </div>
                <div class="rank-badge small">
                  <span class="rank-num">{{ idx + 2 }}</span><sup>{{ rankSuffix(idx + 2) }}</sup>
                </div>
              </div>
              <div class="card-info">
                <div class="card-header">
                  <DifficultyFace
                      :difficulty="(level.difficulty || 'NA') as any"
                      :stars="0"
                      :rate="(level.rating || 'NA') as any"
                      :moons="isPlatformer(level)"
                      :size="40"
                  />
                  <div class="card-title">
                    <span class="card-name" :title="levelDisplayName(level)">
                      {{ levelDisplayName(level) }}
                    </span>
                    <span class="card-creator" :title="creatorDisplayName(level)">
                      by {{ creatorDisplayName(level) }}
                    </span>
                  </div>
                </div>
                <div class="card-footer">
                  <span class="card-requests">{{ formatRequests(level.requests) }} requests</span>
                </div>
              </div>
            </button>
          </div>
        </Container>
      </div>

      <transition name="refresh-fade">
        <div v-if="refreshing" class="refresh-overlay">
          <LoadingCircle :size="56"/>
        </div>
      </transition>
    </template>

    <transition name="modal-fade">
      <div v-if="activeLevel()" class="lightbox" @click.self="closeLevel">
        <div class="lightbox-content">
          <button class="lightbox-close" type="button" @click="closeLevel" aria-label="Close">
            <img src="/icons/cross.svg" alt="Close"/>
          </button>

          <div class="lightbox-image-wrap" @click="closeLevel">
            <img
                v-if="activeLevel()"
                :src="`/thumbnail/${activeLevel()!.level_id}`"
                :alt="levelDisplayName(activeLevel()!)"
                onerror="this.alt = 'Oops! Seems like this level is missing a thumbnail!'; this.style='padding: 128px;';"
            />
          </div>

          <div class="lightbox-info" v-if="activeLevel()">
            <div class="lightbox-top-row">
              <div class="lightbox-rank">
                <span class="rank-num">{{ levels.findIndex(l => l.level_id === activeLevel()!.level_id) + 1 }}</span>
                <sup>{{ rankSuffix(levels.findIndex(l => l.level_id === activeLevel()!.level_id) + 1) }}</sup>
              </div>

              <div class="lightbox-face">
                <DifficultyFace
                    :difficulty="(activeLevel()!.difficulty || 'NA') as any"
                    :stars="0"
                    :rate="(activeLevel()!.rating || 'NA') as any"
                    :moons="isPlatformer(activeLevel()!)"
                    :size="56"
                />
              </div>

              <div class="lightbox-meta">
                <a :href="levelUrl(activeLevel()!)" target="_blank" rel="noopener" class="lightbox-name">
                  {{ levelDisplayName(activeLevel()!) }}
                </a>
                <a v-if="creatorUrl(activeLevel()!)" :href="creatorUrl(activeLevel()!)" target="_blank" rel="noopener"
                   class="lightbox-creator">
                  by {{ creatorDisplayName(activeLevel()!) }}
                </a>
                <span v-else class="lightbox-creator">by {{ creatorDisplayName(activeLevel()!) }}</span>
              </div>
            </div>

            <div class="lightbox-requests">
              <span class="requests-num">
                {{ activeLevel()!.requests.toLocaleString() }}
              </span>
              <span class="requests-label">requests</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </main>
  <Footer/>
</template>

<style scoped>
:global(:root) {
  background: rgba(11, 10, 23, 1.0) !important;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 900px;
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
      rgba(11, 10, 23, 0.15) 0%,
      rgba(11, 10, 23, 0.7) 55%,
      rgba(11, 10, 23, 1.0) 95%
  );
  z-index: 2;
}

.glow-1, .glow-2, .glow-3 {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  z-index: 1;
  opacity: 0.5;
}

.glow-1 {
  width: 620px;
  height: 620px;
  top: -220px;
  left: -200px;
  background: rgba(255, 61, 138, 0.2);
}

.glow-2 {
  width: 520px;
  height: 520px;
  top: 60px;
  right: -200px;
  background: rgba(63, 169, 255, 0.16);
}

.glow-3 {
  width: 480px;
  height: 480px;
  top: 320px;
  left: 30%;
  background: rgba(139, 92, 246, 0.16);
}

.hero-section {
  padding-top: 180px;
  padding-bottom: 24px;
  text-align: center;
}

.title-gradient {
  background: linear-gradient(100deg, #d9acbf, #c0daf8, #fde7c7, #c0daf8, #d9acbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 4.5em;
  animation: gradientAnimation 6s linear infinite;
  background-size: 200% auto;
  line-height: normal;
  margin: 22px 0 18px;
}

@keyframes gradientAnimation {
  to {
    background-position: -200% center;
  }
}

.hero-description {
  font-size: 1.1em;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
  font-family: "Inter", sans-serif;
  max-width: 640px;
  margin: 0 auto 32px;
  line-height: 1.6;
}

.period-selector {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  background: rgba(29, 29, 65, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

.period-btn {
  font-family: "Inter", sans-serif;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  border: none;
  border-radius: 999px;
  padding: 9px 22px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: manipulation;
}

.period-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
}

.period-btn.active {
  background: linear-gradient(135deg, rgba(255, 61, 138, 0.35), rgba(63, 169, 255, 0.35));
  color: #fff;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 140px 24px;
  gap: 24px;
}

.loading-text {
  font-family: "Inter", sans-serif;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.95rem;
  margin: 0;
}

.error-card {
  margin: 60px auto;
  max-width: 460px;
  background: rgba(29, 29, 65, 0.6);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.error-card img {
  width: 56px;
  height: 56px;
  opacity: 0.6;
}

.error-card h3 {
  font-family: "Alata", sans-serif;
  font-size: 1.5rem;
  margin: 16px 0 8px;
  color: #fff;
}

.error-message {
  font-family: "Inter", sans-serif;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 24px;
  font-size: 0.95rem;
}

.content-wrap {
  transition: opacity 0.25s ease;
}

.content-wrap.refreshing {
  opacity: 0.35;
  pointer-events: none;
}

.refresh-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.refresh-fade-enter-active,
.refresh-fade-leave-active {
  transition: opacity 0.25s ease;
}

.refresh-fade-enter-from,
.refresh-fade-leave-to {
  opacity: 0;
}

.featured-section {
  padding: 24px 32px 8px;
}

.featured-card {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0;
  background: rgba(29, 29, 65, 0.55);
  border: 1px solid rgba(253, 231, 199, 0.35);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s;
  cursor: pointer;
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.featured-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.featured-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-thumb img.loaded {
  opacity: 1;
}

.featured-thumb:hover img.loaded {
  transform: scale(1.04);
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.featured-thumb:hover .thumb-overlay,
.card-thumb:hover .thumb-overlay {
  opacity: 1;
}

.view-hint {
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.rank-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  font-family: "Alata", sans-serif;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #fde7c7, #f4c162);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: baseline;
  line-height: 1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  z-index: 2;
}

.rank-badge sup {
  -webkit-text-fill-color: #fff;
  font-size: 0.45em;
  margin-left: 2px;
  opacity: 0.7;
}

.rank-badge.small {
  font-size: 1.4rem;
  top: 12px;
  left: 12px;
}

.featured-info {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.featured-header {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 4px;
}

.featured-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.featured-name {
  font-family: "Alata", sans-serif;
  font-size: 1.7rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  line-height: 1.2;
  word-break: break-word;
  transition: color 0.3s ease;
}

.featured-name:hover {
  color: #7eb3ff;
}

.featured-creator {
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.3s ease;
}

.featured-creator:hover {
  color: #7eb3ff;
}

.featured-stats {
  display: flex;
  align-items: center;
  gap: 28px;
}

.featured-requests {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.requests-num {
  font-family: "Alata", sans-serif;
  font-size: 2.2rem;
  font-weight: bold;
  color: #fff;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.requests-label {
  font-family: "Inter", sans-serif;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.25px;
  color: rgba(255, 255, 255, 0.5);
}

.grid-section {
  padding: 32px 32px 80px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.level-card {
  background: rgba(29, 29, 65, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s;
  touch-action: manipulation;
}

.level-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.card-thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-thumb img.loaded {
  opacity: 1;
}

.card-thumb:hover img.loaded {
  transform: scale(1.04);
}

.card-info {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.card-name {
  font-family: "Alata", sans-serif;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.card-creator {
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}

.card-requests {
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.lightbox-content {
  position: relative;
  max-width: 920px;
  width: 100%;
  background: rgba(29, 29, 65, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
  margin: auto;
}

.lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  padding: 0;
  touch-action: manipulation;
}

.lightbox-close img {
  width: 16px;
  height: 16px;
}

.lightbox-close:active {
  transform: scale(0.92);
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.85);
}

.lightbox-image-wrap {
  cursor: pointer;
}

.lightbox-image-wrap img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 55vh;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.4);
}

.lightbox-info {
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.lightbox-top-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.lightbox-rank {
  font-family: "Alata", sans-serif;
  font-size: 2rem;
  font-weight: bold;
  color: #fde7c7;
  display: flex;
  align-items: baseline;
  line-height: 1;
  flex-shrink: 0;
}

.lightbox-rank sup {
  font-size: 0.45em;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 2px;
}

.lightbox-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.lightbox-name {
  font-family: "Alata", sans-serif;
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;
  word-break: break-word;
}

.lightbox-name:hover {
  color: #7eb3ff;
}

.lightbox-creator {
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.3s ease;
  word-break: break-word;
}

.lightbox-creator:hover {
  color: #7eb3ff;
}

.lightbox-face {
  flex-shrink: 0;
}

.lightbox-requests {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.lightbox-requests .requests-num {
  font-size: 1.8rem;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .lightbox-content,
.modal-fade-leave-active .lightbox-content {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .lightbox-content,
.modal-fade-leave-to .lightbox-content {
  transform: scale(0.92);
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

@media (max-width: 1010px) {
  .featured-header {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .featured-card {
    grid-template-columns: 1fr;
  }

  .featured-thumb {
    aspect-ratio: 16 / 9;
  }

  .featured-info {
    padding: 24px;
  }
}

@media (max-width: 800px) {
  .title-gradient {
    font-size: 3em;
  }

  .hero-section {
    padding-top: 140px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .featured-section,
  .grid-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .level-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .period-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .lightbox {
    padding: 12px;
  }

  .lightbox-info {
    flex-direction: column;
    align-items: stretch;
    padding: 20px 16px;
    gap: 16px;
  }

  .lightbox-requests {
    align-items: flex-start;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .lightbox-requests .requests-num {
    font-size: 1.5rem;
  }
}

@media (max-width: 520px) {
  .level-grid {
    grid-template-columns: 1fr;
  }

  .featured-info {
    padding: 20px 16px;
    gap: 12px;
  }

  .featured-name {
    font-size: 1.3rem;
  }

  .featured-creator {
    font-size: 0.85rem;
  }

  .requests-num {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .lightbox-top-row {
    gap: 12px;
  }

  .lightbox-rank {
    font-size: 1.5rem;
  }

  .lightbox-name {
    font-size: 1.1rem;
  }
}
</style>
