<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import ChartCanvas from '../../components/ChartCanvas.vue';
import LazyCounter from '../../components/LazyCounter.vue';
import LoadingCircle from '../../components/LoadingCircle.vue';

import type { UserStats, StatsResponse, UserHistoryPoint, StatsHistoryPoint } from '../../lib/types';
import { unwrap, fetchJson, formatMonth, formatDateTime } from '../../lib/utils';

const loading = ref(true);
const error = ref<string | null>(null);
const user = ref<UserStats | null>(null);
const stats = ref<StatsResponse | null>(null);
const userHistory = ref<UserHistoryPoint[]>([]);
const statsHistory = ref<StatsHistoryPoint[]>([]);

const acceptedRate = computed(() => {
  if (!user.value || user.value.upload_count === 0) return 0;
  return (user.value.accepted_upload_count / user.value.upload_count) * 100;
});

const expectedRate = computed(() => {
  if (!user.value || user.value.upload_count === 0) return 0;
  const expectedAccepted = user.value.accepted_upload_count + user.value.pending_upload_count;
  return Math.min(100, (expectedAccepted / user.value.upload_count) * 100);
});

const rejectionCount = computed(() => {
  if (!user.value) return 0;
  return Math.max(0, user.value.upload_count - user.value.accepted_upload_count - user.value.pending_upload_count);
});

const replacementCount = computed(() => {
  if (!user.value) return 0;
  return Math.max(0, user.value.accepted_upload_count - user.value.active_thumbnail_count);
});

const activityChart = computed<ChartConfiguration<'bar', number[], string>>(() => ({
  type: 'bar',
  data: {
    labels: userHistory.value.map((point) => formatMonth(point.period)),
    datasets: [
      {
        label: 'Accepted',
        data: userHistory.value.map((point) => point.accepted_upload_count),
        backgroundColor: 'rgba(78, 159, 255, 0.72)',
        borderRadius: 8,
        borderSkipped: false,
        stack: 'status',
      },
      {
        label: 'Pending',
        data: userHistory.value.map((point) => point.pending_upload_count),
        backgroundColor: 'rgba(255, 209, 102, 0.84)',
        borderRadius: 8,
        borderSkipped: false,
        stack: 'status',
      },
      {
        label: 'Rejected',
        data: userHistory.value.map((point) => Math.max(0, point.upload_count - point.accepted_upload_count - point.pending_upload_count)),
        backgroundColor: 'rgba(255, 109, 109, 0.78)',
        borderRadius: 8,
        borderSkipped: false,
        stack: 'status',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e7e7e7',
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${(Number(context.parsed.y ?? 0)).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#cfcfcf' },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: { color: '#cfcfcf', precision: 0 },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  },
}));

const statsChart = computed<ChartConfiguration<'line', number[], string>>(() => ({
  type: 'line',
  data: {
    labels: statsHistory.value.map((point) => formatDateTime(point.captured_at)),
    datasets: [
      {
        label: 'Thumbnails',
        data: statsHistory.value.map((point) => point.thumbnails_count),
        borderColor: 'rgba(255, 209, 102, 0.95)',
        backgroundColor: 'rgba(255, 209, 102, 0.14)',
        tension: 0.32,
        fill: true,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'Storage (GB)',
        data: statsHistory.value.map((point) => point.storage_bytes / 1024 / 1024 / 1024),
        borderColor: 'rgba(77, 214, 141, 0.95)',
        backgroundColor: 'rgba(77, 214, 141, 0.14)',
        tension: 0.32,
        fill: true,
        pointRadius: 0,
        yAxisID: 'y1',
      },
      {
        label: 'Users (total)',
        data: statsHistory.value.map((point) => point.users_total),
        borderColor: 'rgba(138, 109, 255, 0.9)',
        backgroundColor: 'rgba(138, 109, 255, 0.08)',
        tension: 0.28,
        fill: false,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'Uploads (total)',
        data: statsHistory.value.map((point) => point.uploads_total),
        borderColor: 'rgba(255, 119, 87, 0.92)',
        backgroundColor: 'rgba(255, 119, 87, 0.08)',
        tension: 0.28,
        fill: false,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'Pending (total)',
        data: statsHistory.value.map((point) => point.pending_uploads_total),
        borderColor: 'rgba(255, 186, 119, 0.92)',
        backgroundColor: 'rgba(255, 186, 119, 0.06)',
        borderDash: [4, 4],
        tension: 0.18,
        fill: false,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'Accepted (total)',
        data: statsHistory.value.map((point) => point.accepted_uploads_total),
        borderColor: 'rgba(102, 204, 255, 0.88)',
        backgroundColor: 'rgba(102, 204, 255, 0.06)',
        tension: 0.28,
        fill: false,
        pointRadius: 0,
        yAxisID: 'y',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e7e7e7',
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => items && items.length ? String(items[0].label) : '',
          label: (context) => {
            if (context.dataset.label === 'Storage (GB)') {
              return `${context.dataset.label}: ${Number(context.parsed.y ?? 0).toFixed(2)} GB`;
            }
            return `${context.dataset.label}: ${(Number(context.parsed.y ?? 0)).toLocaleString()}`;
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: '#cfcfcf', maxRotation: 0, autoSkip: true },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        beginAtZero: true,
        position: 'left',
        ticks: { color: '#cfcfcf' },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        ticks: { color: '#cfcfcf' },
        grid: { drawOnChartArea: false },
      },
    },
  },
}));

async function loadDashboard() {
  loading.value = true;
  error.value = null;

  try {
    const [userPayload, statsPayload] = await Promise.all([
      fetchJson('/user/me'),
      fetchJson('/stats'),
    ]);

    user.value = unwrap<UserStats>(userPayload);
    stats.value = unwrap<StatsResponse>(statsPayload);

    const [userHistoryResult, statsHistoryResult] = await Promise.allSettled([
      fetchJson('/user/me/history?months=12'),
      fetchJson('/stats/history?limit=72'),
    ]);

    userHistory.value = userHistoryResult.status === 'fulfilled'
      ? (unwrap<UserHistoryPoint[]>(userHistoryResult.value) || [])
      : [];

    statsHistory.value = statsHistoryResult.status === 'fulfilled'
      ? (unwrap<StatsHistoryPoint[]>(statsHistoryResult.value) || [])
      : [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard-root">
    <div v-if="loading" class="loading-state">
      <LoadingCircle />
    </div>

    <div v-else-if="error" class="error-message">
      <img src="/error.svg" alt="Error Icon" class="error-icon" />
      <p>{{ error }}</p>
    </div>

    <div v-else class="dashboard-container page-transition">
      <header class="hero card">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h2>Welcome back, {{ user!.username }}</h2>
        </div>
        <div class="hero-metrics">
          <div class="hero-metric">
            <span class="metric-label">Acceptance</span>
            <strong>{{ acceptedRate.toFixed(1) }}%</strong>
          </div>
          <div class="hero-metric">
            <span class="metric-label">Active</span>
            <strong>{{ user!.active_thumbnail_count.toLocaleString() }}</strong>
          </div>
        </div>
      </header>

      <section class="grid">
        <article class="card activity-card">
          <div class="card-head">
            <h3>Your activity</h3>
          </div>

          <div class="stats-grid">
            <div class="stat-tile">
              <img src="/icons/upload.svg" alt="Uploads" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Uploads</span>
                <strong>
                  <LazyCounter :value="user!.upload_count" />
                </strong>
              </div>
            </div>
            <div class="stat-tile">
              <img src="/icons/checkmark.svg" alt="Accepted" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Accepted</span>
                <strong>
                  <LazyCounter :value="user!.accepted_upload_count" />
                </strong>
              </div>
            </div>
            <div class="stat-tile">
              <img src="/icons/levels.svg" alt="Unique levels" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Unique levels</span>
                <strong>
                  <LazyCounter :value="user!.level_count" />
                </strong>
              </div>
            </div>
            <div class="stat-tile">
              <img src="/icons/active.svg" alt="Active thumbnails" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Active thumbnails</span>
                <strong>
                  <LazyCounter :value="user!.active_thumbnail_count" />
                </strong>
              </div>
            </div>
          </div>

          <div class="meter-card">
            <div class="meter-header">
              <span>Acceptance rate</span>
            </div>
            <div class="meter-row">
              <div class="meter-track" role="progressbar" :aria-valuemin="0" :aria-valuemax="100"
                :aria-valuenow="Math.round(acceptedRate)">
                <div class="meter-fill expected" :style="{ width: `${Math.min(100, expectedRate)}%` }">
                </div>

                <div class="meter-fill accepted" :style="{ width: `${Math.min(100, acceptedRate)}%` }">
                </div>
              </div>

              <div class="meter-track-label">
                <strong>{{ acceptedRate.toFixed(1) }}% <small class="expected-subtle">({{
                  expectedRate.toFixed(1)
                }}%)</small></strong>
              </div>
            </div>
          </div>

          <div class="insights-grid activity-insights">
            <div class="stat-tile">
              <img src="/icons/rejected.svg" alt="Rejected uploads" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Rejected uploads</span>
                <strong>{{ rejectionCount.toLocaleString() }}</strong>
              </div>
            </div>
            <div class="stat-tile">
              <img src="/icons/pending2.svg" alt="Pending uploads" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Pending uploads</span>
                <strong>{{ user!.pending_upload_count.toLocaleString() }}</strong>
              </div>
            </div>
            <div class="stat-tile">
              <img src="/icons/replacement.svg" alt="Replaced thumbnails" class="stat-icon"/>
              <div class="stat-content">
                <span class="stat-label">Replaced thumbnails</span>
                <strong>{{ replacementCount.toLocaleString() }}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="card chart-card upload-history-card">
          <div class="card-head">
            <h3>Upload history</h3>
          </div>
          <ChartCanvas v-if="userHistory.length" :config="activityChart" />
        </article>

        <article class="card chart-card chart-card-wide server-history-card">
          <div class="card-head">
            <h3>Server history</h3>
          </div>
          <ChartCanvas v-if="statsHistory.length" :config="statsChart" />
        </article>

        <article class="card site-stats-card">
          <div class="card-head">
            <h3>Site totals</h3>
          </div>

          <div class="site-stats">
            <div class="site-row">
              <span>Total uploads</span>
              <strong>
                <LazyCounter :value="stats!.uploads_total" />
              </strong>
            </div>
            <div class="site-row">
              <span>Accepted uploads</span>
              <strong>
                <LazyCounter :value="stats!.accepted_uploads_total" />
              </strong>
            </div>
            <div class="site-row">
              <span>Total thumbnails</span>
              <strong>
                <LazyCounter :value="stats!.thumbnails" />
              </strong>
            </div>
            <div class="site-row" :title="stats ? stats.online_moderators.join(', ') : ''">
              <span>Moderators online</span>
              <strong>
                <LazyCounter :value="stats!.online_moderators.length" />
              </strong>
            </div>
            <div class="site-row">
              <span>Pending now</span>
              <strong>
                <LazyCounter :value="stats!.current_pending_uploads" />
              </strong>
            </div>
            <div class="site-row">
              <span>Monthly users</span>
              <strong>
                <LazyCounter :value="stats!.users_per_month" />
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-root {
  min-height: 100%;
}

.loading-state,
.error-message {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-message {
  gap: 16px;
  font-size: 1.1rem;
}

.error-icon {
  width: 128px;
  height: auto;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  opacity: 0.72;
}

.hero h2,
.card h3 {
  margin: 0;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 12px;
}

.hero-metric {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  padding: 14px 16px;
  min-width: 120px;
}

.metric-label,
.stat-label {
  display: block;
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.activity-card {
  grid-column: 1 / -1;
}

.upload-history-card,
.site-stats-card {
  grid-column: 1;
}

.server-history-card {
  grid-column: 2;
  grid-row: span 2;
}

.site-stats-card {
  min-height: 220px;
}

.chart-card {
  min-height: 260px;
  display: flex;
  flex-direction: column;
}

.chart-card-wide {
  min-height: 260px;
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-tile {
  background: rgba(0, 0, 0, 0.16);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  opacity: 0.9;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-tile strong,
.hero-metric strong {
  font-size: 1.5rem;
  line-height: 1.1;
}

.site-row strong {
  font-size: 1.25rem;
  line-height: 1.2;
  text-align: right;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.meter-card {
  margin-top: 18px;
  background: rgba(0, 0, 0, 0.14);
  border-radius: 14px;
  padding: 16px;
}

.meter-header,
.site-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.meter-track {
  flex: 1;
  min-width: 0;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  margin: 0;
  position: relative;
}

.meter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 10px;
}

.meter-track-label {
  min-width: 86px;
  text-align: right;
  color: #eaeaea;
}

.meter-fill {
  height: 100%;
  border-radius: inherit;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
}

.meter-fill.expected {
  background: linear-gradient(90deg, rgba(78, 159, 255, 0.2), rgba(86, 211, 142, 0.12));
  z-index: 1;
}

.meter-fill.accepted {
  background: linear-gradient(90deg, #4e9fff, #56d38e);
  z-index: 2;
}

.expected-subtle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.78rem;
  margin-left: 8px;
  font-weight: 600;
  opacity: 0.95;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.activity-insights {
  margin-top: 14px;
}

.site-stats {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}

.chart-card .chart-wrap,
.chart-card-wide .chart-wrap {
  flex: 1;
  min-height: 0;
}

.site-row {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .hero-metrics,
  .insights-grid,
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .site-stats {
    grid-template-columns: 1fr;
  }

  .upload-history-card,
  .site-stats-card,
  .server-history-card {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 700px) {
  .card,
  .hero {
    padding: 18px;
  }

  .hero-metrics,
  .insights-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .card-head,
  .meter-header,
  .site-row,
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>