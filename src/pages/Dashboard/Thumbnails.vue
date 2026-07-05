<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import LoadingCircle from '../../components/LoadingCircle.vue';
import Modal from '../../components/Modal.vue';
import type {
  MyThumbnailActiveItem,
  MyThumbnailRejectedItem,
  PendingItem,
  MyUploadsSummaryResponse,
} from '../../lib/types';
import { fetchJson, formatDateTime, unwrap } from '../../lib/utils';

type ThumbnailTab = 'active' | 'pending' | 'rejected';

const PAGE_SIZE = 12;

const loading = ref(true);
const refreshing = ref(false);
const error = ref<string | null>(null);
const currentTab = ref<ThumbnailTab>('active');

const activePage = ref(1);
const pendingPage = ref(1);
const rejectedPage = ref(1);
const activePageInput = ref('');
const pendingPageInput = ref('');
const rejectedPageInput = ref('');

const activeItems = ref<MyThumbnailActiveItem[]>([]);
const pendingItems = ref<PendingItem[]>([]);
const rejectedItems = ref<MyThumbnailRejectedItem[]>([]);

const activeTotal = ref(0);
const pendingTotal = ref(0);
const rejectedTotal = ref(0);

const levelIdSearch = ref('');

const previewOpen = ref(false);
const previewTitle = ref('');
const previewSrc = ref('');

function totalPages(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

const activeTotalPages = computed(() => totalPages(activeTotal.value));
const pendingTotalPages = computed(() => totalPages(pendingTotal.value));
const rejectedTotalPages = computed(() => totalPages(rejectedTotal.value));

function levelTitle(level: MyThumbnailActiveItem | PendingItem | MyThumbnailRejectedItem): string {
  return level.note_data?.level_name || `ID: ${level.level_id}`;
}

function levelAuthor(level: MyThumbnailActiveItem | PendingItem | MyThumbnailRejectedItem): string | null {
  return level.note_data?.creator_name || null;
}

function sameTimestamp(first: string | null, second: string | null): boolean {
  return !!first && !!second && first === second;
}

type UploadsPageResponse<T> = {
  uploads: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

function uploadsQuery(page: number) {
  return new URLSearchParams({
    page: page.toString(),
    per_page: PAGE_SIZE.toString(),
    ...(levelIdSearch.value && { level_id_search: levelIdSearch.value }),
  });
}

function currentTabPage() {
  return currentTab.value === 'active' ? activePage.value : currentTab.value === 'pending' ? pendingPage.value : rejectedPage.value;
}

function currentTabEndpoint(tab: ThumbnailTab) {
  if (tab === 'active') return '/user/me/uploads/active';
  if (tab === 'pending') return '/user/me/uploads/pending';
  return '/user/me/uploads/rejected';
}

async function fetchUploadSummary() {
  const payload = await fetchJson(`/user/me/uploads/summary?${uploadsQuery(1).toString()}`);
  const summary = unwrap<MyUploadsSummaryResponse>(payload);
  activeTotal.value = summary.active;
  pendingTotal.value = summary.pending;
  rejectedTotal.value = summary.rejected;
}

async function fetchTabUploads(tab: ThumbnailTab, page = currentTabPage()) {
  const payload = await fetchJson(`${currentTabEndpoint(tab)}?${uploadsQuery(page).toString()}`);
  return unwrap<UploadsPageResponse<
    MyThumbnailActiveItem | PendingItem | MyThumbnailRejectedItem
  >>(payload);
}

async function loadInitialData() {
  try {
    const [_, activeData] = await Promise.all([
      fetchUploadSummary(),
      fetchTabUploads('active', activePage.value),
    ]);

    activeItems.value = activeData.uploads as MyThumbnailActiveItem[];
    activePage.value = activeData.page;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load thumbnails';
  } finally {
    loading.value = false;
  }
}

async function refreshCurrentTab(includeSummary = false) {
  refreshing.value = true;
  error.value = null;

  try {
    if (includeSummary) {
      await fetchUploadSummary();
    }

    const data = await fetchTabUploads(currentTab.value, currentTabPage());

    if (currentTab.value === 'active') {
      activeItems.value = data.uploads as MyThumbnailActiveItem[];
      activeTotal.value = data.total;
      activePage.value = data.page;
    } else if (currentTab.value === 'pending') {
      pendingItems.value = data.uploads as PendingItem[];
      pendingTotal.value = data.total;
      pendingPage.value = data.page;
    } else {
      rejectedItems.value = data.uploads as MyThumbnailRejectedItem[];
      rejectedTotal.value = data.total;
      rejectedPage.value = data.page;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load thumbnails';
  } finally {
    refreshing.value = false;
  }
}

function goToPage(tab: ThumbnailTab, page: number) {
  const limit = tab === 'active' ? activeTotalPages.value : tab === 'pending' ? pendingTotalPages.value : rejectedTotalPages.value;

  if (page < 1 || page > limit) return;

  if (tab === 'active') activePage.value = page;
  if (tab === 'pending') pendingPage.value = page;
  if (tab === 'rejected') rejectedPage.value = page;

  void refreshCurrentTab();
}

function goToFirstPage(tab: ThumbnailTab) {
  goToPage(tab, 1);
}

function goToLastPage(tab: ThumbnailTab) {
  const total = tab === 'active' ? activeTotalPages.value : tab === 'pending' ? pendingTotalPages.value : rejectedTotalPages.value;
  goToPage(tab, total);
}

function handlePageInput(tab: ThumbnailTab) {
  const raw = tab === 'active' ? activePageInput.value : tab === 'pending' ? pendingPageInput.value : rejectedPageInput.value;
  const page = parseInt(raw, 10);
  const limit = tab === 'active' ? activeTotalPages.value : tab === 'pending' ? pendingTotalPages.value : rejectedTotalPages.value;

  if (!Number.isNaN(page) && page >= 1 && page <= limit) {
    goToPage(tab, page);
  }

  if (tab === 'active') activePageInput.value = '';
  if (tab === 'pending') pendingPageInput.value = '';
  if (tab === 'rejected') rejectedPageInput.value = '';
}

function pageInfo(tab: ThumbnailTab) {
  if (tab === 'active') return { page: activePage.value, totalPages: activeTotalPages.value };
  if (tab === 'pending') return { page: pendingPage.value, totalPages: pendingTotalPages.value };
  return { page: rejectedPage.value, totalPages: rejectedTotalPages.value };
}

function setTab(tab: ThumbnailTab) {
  currentTab.value = tab;
  void refreshCurrentTab();
}

function getActiveImageUrl(levelId: number) {
  return `/thumbnail/${levelId}/small`;
}

function getPendingImageUrl(id: number) {
  return `/pending/${id}/image`;
}

function getActiveFullImageUrl(levelId: number) {
  return `/thumbnail/${levelId}`;
}

function openPreview(src: string, title: string) {
  previewSrc.value = src;
  previewTitle.value = title;
  previewOpen.value = true;
}

function closePreview() {
  previewOpen.value = false;
}

watch(levelIdSearch, () => {
  activePage.value = 1;
  pendingPage.value = 1;
  rejectedPage.value = 1;
  void refreshCurrentTab(true);
});

onMounted(() => {
  void loadInitialData();
});
</script>

<template>
  <div v-if="loading" class="d-flex flex-middle h-100">
    <LoadingCircle />
  </div>

  <div v-else class="my-thumbnails page-transition">
    <div v-if="error" class="notice notice-error">
      <img src="/error.svg" alt="Error Icon" class="notice-icon" />
      <p>{{ error }}</p>
    </div>

    <header class="hero card">
      <div>
        <p class="eyebrow">My Thumbnails</p>
        <h2>Your uploads at a glance</h2>
        <p class="hero-copy">Track active thumbnails, pending submissions, and rejected uploads.</p>
      </div>
      <div class="hero-metrics">
        <div class="hero-metric">
          <img src="/icons/check.svg" alt="Active" class="metric-icon" />
          <span class="metric-label">Active</span>
          <strong>{{ activeTotal }}</strong>
        </div>
        <div class="hero-metric">
          <img src="/icons/pending2.svg" alt="Pending" class="metric-icon" />
          <span class="metric-label">Pending</span>
          <strong>{{ pendingTotal }}</strong>
        </div>
        <div class="hero-metric">
          <img src="/icons/cross.svg" alt="Rejected" class="metric-icon" />
          <span class="metric-label">Rejected</span>
          <strong>{{ rejectedTotal }}</strong>
        </div>
      </div>
    </header>

    <nav class="tab-bar card" aria-label="Thumbnail categories">
      <div class="tab-buttons">
        <button class="tab-button" :class="{ active: currentTab === 'active' }" @click="setTab('active')">
          <img src="/icons/check.svg" alt="Active" class="tab-icon" />
          Active <span>{{ activeTotal }}</span>
        </button>
        <button class="tab-button" :class="{ active: currentTab === 'pending' }" @click="setTab('pending')">
          <img src="/icons/pending2.svg" alt="Pending" class="tab-icon" />
          Pending <span>{{ pendingTotal }}</span>
        </button>
        <button class="tab-button" :class="{ active: currentTab === 'rejected' }" @click="setTab('rejected')">
          <img src="/icons/cross.svg" alt="Rejected" class="tab-icon" />
          Rejected <span>{{ rejectedTotal }}</span>
        </button>
      </div>

      <div class="tab-filter">
        <input
          id="levelIdSearch"
          v-model="levelIdSearch"
          type="text"
          inputmode="numeric"
          placeholder="Filter by level ID"
          class="filter-input"
        />
      </div>
    </nav>

    <section v-if="currentTab === 'active'" class="section card">
      <div class="card-head">
        <div>
          <h3>
            <img src="/icons/check.svg" alt="Active" class="section-icon" />
            Currently active thumbnails
          </h3>
          <p class="section-copy">These are thumbnails that are currently visible to everyone.</p>
        </div>
        <div class="pager-summary">Page {{ pageInfo('active').page }} / {{ pageInfo('active').totalPages }}</div>
      </div>

      <div v-if="activeItems.length === 0" class="empty-state">
        <p>No active thumbnails yet.</p>
      </div>
      <div class="thumbnail-grid">
        <article v-for="item in activeItems" :key="item.id" class="thumbnail-card">
          <button
            type="button"
            class="thumbnail-link"
            @click="openPreview(getActiveFullImageUrl(item.level_id), levelTitle(item))"
          >
            <img :src="getActiveImageUrl(item.level_id)" :alt="`Level ${item.level_id}`" class="thumbnail-image" loading="lazy" />
          </button>
          <div class="thumbnail-content">
            <strong class="level-heading">
              {{ levelTitle(item) }}
              <span v-if="levelAuthor(item)" class="level-author">(by {{ levelAuthor(item) }})</span>
            </strong>
            <span v-if="item.note_data" class="level-id-line">ID: {{ item.level_id }}</span>
            <span v-if="sameTimestamp(item.upload_time, item.accepted_time)" class="muted timeline-line">
              <img src="/icons/check.svg" alt="Accepted" class="inline-icon" />
              Uploaded {{ formatDateTime(item.upload_time) }}
            </span>
            <template v-else>
              <span class="muted timeline-line">
                <img src="/icons/upload.svg" alt="Uploaded" class="inline-icon" />
                Uploaded {{ formatDateTime(item.upload_time) }}
              </span>
              <span v-if="item.accepted_time" class="muted timeline-line">
                <img src="/icons/check.svg" alt="Accepted" class="inline-icon" />
                Accepted {{ formatDateTime(item.accepted_time) }}
              </span>
            </template>
          </div>
        </article>
      </div>

      <div class="pagination-controls" v-if="activeTotalPages > 1">
        <button class="btn btn-secondary btn-sm" title="First page" :disabled="pageInfo('active').page === 1" @click="goToFirstPage('active')">
          <img src="/icons/first.svg" alt="⏮" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('active').page === 1" @click="goToPage('active', pageInfo('active').page - 1)">
          <img src="/icons/previous.svg" alt="◂" class="nav-icon" />
        </button>
        <span class="page-info">Page {{ pageInfo('active').page }} of {{ pageInfo('active').totalPages }}</span>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('active').page === pageInfo('active').totalPages" @click="goToPage('active', pageInfo('active').page + 1)">
          <img src="/icons/next.svg" alt="▸" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" title="Last page" :disabled="pageInfo('active').page === pageInfo('active').totalPages" @click="goToLastPage('active')">
          <img src="/icons/last.svg" alt="⏭" class="nav-icon" />
        </button>
        <input v-model="activePageInput" class="page-input" type="number" placeholder="Go to..." min="1" :max="pageInfo('active').totalPages" @keyup.enter="handlePageInput('active')" />
        <button class="btn btn-secondary btn-sm" :disabled="!activePageInput" @click="handlePageInput('active')">Go</button>
      </div>
    </section>

    <section v-else-if="currentTab === 'pending'" class="section card">
      <div class="card-head">
        <div>
          <h3>
            <img src="/icons/pending2.svg" alt="Pending" class="section-icon" />
            Pending uploads
          </h3>
          <p class="section-copy">These uploads are waiting for moderation.</p>
        </div>
        <div class="pager-summary">Page {{ pageInfo('pending').page }} / {{ pageInfo('pending').totalPages }}</div>
      </div>

      <div v-if="pendingItems.length === 0" class="empty-state">
        <p>No pending uploads right now.</p>
      </div>
      <div v-else class="thumbnail-grid">
        <article v-for="item in pendingItems" :key="item.id" class="thumbnail-card pending-card">
          <button
            type="button"
            class="thumbnail-link"
            @click="openPreview(getPendingImageUrl(item.id), levelTitle(item))"
          >
            <img :src="getPendingImageUrl(item.id)" :alt="`Pending upload ${item.id}`" class="thumbnail-image" loading="lazy" />
          </button>
          <div class="thumbnail-content">
            <strong class="level-heading">
              {{ levelTitle(item) }}
              <span v-if="levelAuthor(item)" class="level-author">(by {{ levelAuthor(item) }})</span>
            </strong>
            <span v-if="item.note_data" class="level-id-line">ID: {{ item.level_id }}</span>
            <span class="muted timeline-line">
              <img src="/icons/upload.svg" alt="Submitted" class="inline-icon" />
              Submitted {{ formatDateTime(item.upload_time) }}
            </span>
          </div>
        </article>
      </div>

      <div class="pagination-controls" v-if="pendingTotalPages > 1">
        <button class="btn btn-secondary btn-sm" title="First page" :disabled="pageInfo('pending').page === 1" @click="goToFirstPage('pending')">
          <img src="/icons/first.svg" alt="⏮" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('pending').page === 1" @click="goToPage('pending', pageInfo('pending').page - 1)">
          <img src="/icons/previous.svg" alt="◂" class="nav-icon" />
        </button>
        <span class="page-info">Page {{ pageInfo('pending').page }} of {{ pageInfo('pending').totalPages }}</span>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('pending').page === pageInfo('pending').totalPages" @click="goToPage('pending', pageInfo('pending').page + 1)">
          <img src="/icons/next.svg" alt="▸" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" title="Last page" :disabled="pageInfo('pending').page === pageInfo('pending').totalPages" @click="goToLastPage('pending')">
          <img src="/icons/last.svg" alt="⏭" class="nav-icon" />
        </button>
        <input v-model="pendingPageInput" class="page-input" type="number" placeholder="Go to..." min="1" :max="pageInfo('pending').totalPages" @keyup.enter="handlePageInput('pending')" />
        <button class="btn btn-secondary btn-sm" :disabled="!pendingPageInput" @click="handlePageInput('pending')">Go</button>
      </div>
    </section>

    <section v-else class="section card">
      <div class="card-head">
        <div>
          <h3>
            <img src="/icons/cross.svg" alt="Rejected" class="section-icon" />
            Rejected uploads
          </h3>
          <p class="section-copy">Uploads that had issues and were rejected by moderators.</p>
        </div>
        <div class="pager-summary">Page {{ pageInfo('rejected').page }} / {{ pageInfo('rejected').totalPages }}</div>
      </div>

      <div v-if="rejectedItems.length === 0" class="empty-state">
        <p>No rejected uploads yet.</p>
      </div>
      <div v-else class="rejected-grid">
        <article v-for="item in rejectedItems" :key="item.id" class="rejected-card">
          <button
              type="button"
              class="thumbnail-link"
              @click="openPreview(getPendingImageUrl(item.id), levelTitle(item))"
          >
            <img :src="getPendingImageUrl(item.id)" :alt="`Pending upload ${item.id}`" class="thumbnail-image" loading="lazy" onerror="this.style.display='none'"/>
          </button>
          <div class="rejected-header">
            <div>
              <strong class="level-heading">
                {{ levelTitle(item) }}
                <span v-if="levelAuthor(item)" class="level-author">(by {{ levelAuthor(item) }})</span>
              </strong>
              <span v-if="item.note_data" class="level-id-line">ID: {{ item.level_id }}</span>
            </div>
          </div>
          <div class="rejected-body">
            <p class="reason-line">
              <img src="/icons/cross.svg" alt="Rejected" class="inline-icon" />
              <strong>Reason:</strong> {{ item.reason || 'No reason provided' }}
            </p>
            <p v-if="item.accepted_time" class="reviewed-line muted">
              <img src="/icons/moderator.svg" alt="Reviewed" class="inline-icon" />
              Reviewed by {{ item.accepted_by_username || 'Moderator' }} on {{ formatDateTime(item.accepted_time!) }}
            </p>
          </div>
        </article>
      </div>

      <div class="pagination-controls" v-if="rejectedTotalPages > 1">
        <button class="btn btn-secondary btn-sm" title="First page" :disabled="pageInfo('rejected').page === 1" @click="goToFirstPage('rejected')">
          <img src="/icons/first.svg" alt="⏮" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('rejected').page === 1" @click="goToPage('rejected', pageInfo('rejected').page - 1)">
          <img src="/icons/previous.svg" alt="◂" class="nav-icon" />
        </button>
        <span class="page-info">Page {{ pageInfo('rejected').page }} of {{ pageInfo('rejected').totalPages }}</span>
        <button class="btn btn-secondary btn-sm" :disabled="pageInfo('rejected').page === pageInfo('rejected').totalPages" @click="goToPage('rejected', pageInfo('rejected').page + 1)">
          <img src="/icons/next.svg" alt="▸" class="nav-icon" />
        </button>
        <button class="btn btn-secondary btn-sm" title="Last page" :disabled="pageInfo('rejected').page === pageInfo('rejected').totalPages" @click="goToLastPage('rejected')">
          <img src="/icons/last.svg" alt="⏭" class="nav-icon" />
        </button>
        <input v-model="rejectedPageInput" class="page-input" type="number" placeholder="Go to..." min="1" :max="pageInfo('rejected').totalPages" @keyup.enter="handlePageInput('rejected')" />
        <button class="btn btn-secondary btn-sm" :disabled="!rejectedPageInput" @click="handlePageInput('rejected')">Go</button>
      </div>
    </section>

    <Modal :open="previewOpen" :title="previewTitle" dialog-class="modal-dialog--fullscreen" @close="closePreview">
      <img :src="previewSrc" :alt="previewTitle" class="preview-image" />
    </Modal>
  </div>

  <LoadingCircle backdrop v-if="refreshing" />
</template>

<style scoped>
.my-thumbnails {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
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

.hero-copy,
.section-copy {
  margin: 8px 0 0;
  opacity: 0.82;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(90px, 1fr));
  gap: 12px;
}

.hero-metric {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  padding: 14px 16px;
  text-align: center;
}

.metric-icon {
  width: 20px;
  height: 20px;
  display: block;
  margin: 0 auto 6px;
  opacity: 0.85;
}

.metric-label,
.muted {
  display: block;
  font-size: 0.9rem;
  opacity: 0.78;
}

.tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.tab-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tab-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  margin-left: auto;
}

.tab-filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.tab-button {
  border: none;
  background: rgba(0, 0, 0, 0.18);
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
  font: inherit;
}

.tab-button.active {
  background: rgba(78, 159, 255, 0.28);
  box-shadow: inset 0 0 0 1px rgba(78, 159, 255, 0.5);
}

.tab-button span {
  margin-left: 6px;
  opacity: 0.75;
}

.tab-icon {
  width: 16px;
  height: 16px;
  vertical-align: -2px;
  margin-right: 4px;
  opacity: 0.8;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.pager-summary {
  opacity: 0.78;
  white-space: nowrap;
}

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.filter-header h3 {
  font-size: 0.95rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
}

.filter-input {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-family: inherit;
}

.filter-input:focus {
  outline: none;
  border-color: rgba(78, 159, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(78, 159, 255, 0.12);
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.thumbnail-card,
.rejected-card {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pending-card {
  border-color: rgba(255, 209, 102, 0.15);
}

.thumbnail-link {
  display: block;
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
  text-align: left;
}

.thumbnail-image {
  width: 100%;
  display: block;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.04);
}

.thumbnail-content,
.rejected-body,
.rejected-header {
  padding: 14px;
}

.thumbnail-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-heading {
  display: block;
  line-height: 1.2;
}

.level-author {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
}

.level-id-line {
  display: block;
  font-size: 0.83rem;
  opacity: 0.68;
}

.timeline-line {
  display: flex;
  align-items: center;
  gap: 0;
}

.note-line,
.reason-line {
  margin: 0;
}

.note-raw {
  opacity: 0.8;
  word-break: break-word;
}

.empty-state {
  text-align: center;
  padding: 28px 16px;
  opacity: 0.8;
}

.rejected-list {
  display: grid;
  gap: 12px;
}

.rejected-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.rejected-card {
  display: flex;
  flex-direction: column;
}

.rejected-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.rejected-badge {
  background: rgba(255, 109, 109, 0.2);
  color: #ffadad;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.rejected-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.rejected-header {
  padding-top: 10px;
  padding-bottom: 10px;
}

.rejected-header p,
.rejected-body p {
  margin: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.page-info {
  min-width: 90px;
  text-align: center;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.9em;
  border-radius: 10px;
}

.nav-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.page-input {
  width: 120px;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 10px;
  padding: 7px 10px;
}

.page-input:focus {
  outline: none;
  border-color: rgba(78, 159, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(78, 159, 255, 0.12);
}

.preview-image {
  width: auto;
  max-width: 100%;
  max-height: calc(100vh - 120px);
  border-radius: 10px;
  display: block;
  object-fit: contain;
  margin: 0 auto;
}


.notice {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 14px 16px;
}

.notice-error {
  background: rgba(255, 109, 109, 0.12);
  border: 1px solid rgba(255, 109, 109, 0.2);
}

.notice p {
  margin: 0;
}

.notice-icon {
  height: 24px;
  flex-shrink: 0;
}

.inline-icon {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-right: 4px;
  opacity: 0.7;
}

.filter-icon {
  opacity: 0.8;
}

.reviewed-line {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.section-icon {
  width: 22px;
  height: 22px;
  vertical-align: -4px;
  margin-right: 6px;
  opacity: 0.8;
}

@media (max-width: 900px) {
  .hero,
  .card-head,
  .rejected-header {
    flex-direction: column;
  }

  .tab-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .tab-buttons {
    justify-content: center;
  }

  .tab-filter {
    width: 100%;
    min-width: 0;
    margin-left: 0;
  }

  .hero-metrics {
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rejected-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }
}

</style>