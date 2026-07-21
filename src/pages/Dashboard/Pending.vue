<script setup lang="ts">
import {ref, onMounted, watch, computed, onBeforeUnmount} from "vue";
import LoadingCircle from "../../components/LoadingCircle.vue";
import ImageDiffer from "../../components/ImageDiffer.vue";
import DifficultyFace from "../../components/DifficultyFace.vue";
import type { PendingItem, PendingResponse, OriginalThumbnailInfo } from "../../lib/types";
import { fetchJson } from "../../lib/utils";
import {alertModal, confirmModal} from "../../lib/modals";
import SettingsManager from "../../managers/settings.ts";

const REJECT_PRESETS = [
  "Original was better",
  "Original was made by the creator",
  "Screenshot bug",
  "Dead/About to die",
  "Noclip",
  "Obvious speedhack",
  "No gameplay in thumbnail",
  "Too close to start",
  "Texture Pack",
  "Enter Effect bug",
  "No Glow",
  "No Particles",
  "Cutoff Deco",
  "Title Card",
  "Good thumbnail already accepted",
  "Solid Wave Trail"
];

const loading = ref(true);
const refreshing = ref(false);
const error = ref<string | null>(null);
const pendingItems = ref<PendingItem[]>([]);
const selectedItem = ref<PendingItem | null>(null);
const totalItems = ref(0);

const selectedItemFromDirectLink = ref(false);
const directLinkLoading = ref(false);

const originalThumbnailInfo = ref<OriginalThumbnailInfo | null>(null);
const originalThumbnailLoading = ref(false);

const rejectReasonField = ref<HTMLInputElement | null>(null);
const rejectReason = ref<string>("");

const fullscreenLoading = ref(false);

const settings = SettingsManager.getSettings();

const filterUsername = ref<string>("");
const filterLevelId = ref<string>("");
const filterReplacement = ref<string>(settings.replacement_filter); // "all", "replacement", "new"
const filterSearch = ref<string>("");
const filterRatedOnly = ref(settings.pending_rated_only);
const filterFromCreatorOnly = ref(settings.pending_from_creator_only);
const sortBy = ref<'upload_time' | 'level_id' | 'level_name' | 'creator_name' | 'username' | 'stars' | 'rating'>(settings.pending_sort_by);
const sortDir = ref<'asc' | 'desc'>(settings.pending_sort_dir);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const currentPage = ref(1);
const itemsPerPage = ref(settings.pending_per_page);
const pageInput = ref<string>("");

const filteredItems = computed(() => pendingItems.value);
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

const paginatedItems = computed(() => pendingItems.value);

function getPendingItemIdFromUrl() {
  const rawId = new URL(window.location.href).searchParams.get('id');
  if (!rawId) return null;

  const parsedId = Number.parseInt(rawId, 10);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

function updatePendingItemUrl(itemId: number | null, replace = false) {
  const url = new URL(window.location.href);

  if (itemId === null) {
    url.searchParams.delete('id');
  } else {
    url.searchParams.set('id', itemId.toString());
  }

  const state = itemId === null ? null : { pendingItemId: itemId };

  if (replace) {
    history.replaceState(state, '', url.toString());
  } else {
    history.pushState(state, '', url.toString());
  }
}

async function fetchPendingItemById(id: number) {
  return await fetchJson<PendingItem>(`/pending/${id}`);
}

async function openPendingItemById(id: number, fromDirectLink = false) {
  if (fromDirectLink) {
    directLinkLoading.value = true;
  }

  error.value = null;
  originalThumbnailInfo.value = null;

  try {
    const existingItem = pendingItems.value.find(item => item.id === id);
    const item = existingItem ?? await fetchPendingItemById(id);

    selectedItem.value = item;
    selectedItemFromDirectLink.value = fromDirectLink;
  } catch (err) {
    selectedItem.value = null;
    selectedItemFromDirectLink.value = false;

    if (fromDirectLink) {
      error.value = err instanceof Error ? err.message : 'Failed to load the linked pending item';
    }
  } finally {
    if (fromDirectLink) {
      directLinkLoading.value = false;
    }
  }
}

async function fetchOriginalThumbnailInfo(levelId: number) {
  originalThumbnailLoading.value = true;
  try {
    originalThumbnailInfo.value = await fetchJson<OriginalThumbnailInfo>(`/thumbnail/${levelId}/info`);
  } catch (err) {
    originalThumbnailInfo.value = null;
  } finally {
    originalThumbnailLoading.value = false;
  }
}

watch([filterLevelId, filterUsername, filterSearch], () => {
  currentPage.value = 1;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // debounce
  debounceTimer = setTimeout(() => {
    fetchPendingItems();
  }, 500);
});

watch([filterRatedOnly, filterFromCreatorOnly, sortBy, sortDir], () => {
  currentPage.value = 1;
  fetchPendingItems();

  const settings = SettingsManager.getSettings();
  settings.pending_sort_by = sortBy.value;
  settings.pending_sort_dir = sortDir.value;
  settings.pending_rated_only = filterRatedOnly.value;
  settings.pending_from_creator_only = filterFromCreatorOnly.value;
  SettingsManager.saveSettings(settings);
});

watch(filterReplacement, () => {
  currentPage.value = 1;
  fetchPendingItems();

  const settings = SettingsManager.getSettings();
  settings.replacement_filter = filterReplacement.value as 'all' | 'replacement' | 'new';
  SettingsManager.saveSettings(settings);
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
  fetchPendingItems();

  const settings = SettingsManager.getSettings();
  settings.pending_per_page = itemsPerPage.value;
  SettingsManager.saveSettings(settings);
});

watch(currentPage, () => {
  fetchPendingItems();
});

watch(selectedItem, () => {
  rejectReason.value = "";
  originalThumbnailInfo.value = null;

  if (selectedItem.value?.replacement) {
    fetchOriginalThumbnailInfo(selectedItem.value.level_id);
  }
});

watch(selectedItem, (newItem) => {
  if (newItem === null && getPendingItemIdFromUrl() !== null && !directLinkLoading.value) {
    updatePendingItemUrl(null, true);
  }
});

async function fetchPendingItems() {
  const isInitialLoad = loading.value && pendingItems.value.length === 0 && selectedItem.value === null;
  if (!isInitialLoad) {
    refreshing.value = true;
  }

  error.value = null;

  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('per_page', itemsPerPage.value.toString());

    if (filterLevelId.value.trim() !== "") {
      params.append('level_id', filterLevelId.value.trim());
    }

    if (filterUsername.value.trim() !== "") {
      params.append('username', filterUsername.value.trim());
    }

    if (filterSearch.value.trim() !== "") {
      params.append('search', filterSearch.value.trim());
    }

    if (filterRatedOnly.value) {
      params.append('rated_only', 'true');
    }

    if (filterFromCreatorOnly.value) {
      params.append('from_creator_only', 'true');
    }

    if (filterReplacement.value === "replacement") {
      params.append('replacement_only', 'true');
    } else if (filterReplacement.value === "new") {
      params.append('new_only', 'true');
    }

    params.append('sort_by', sortBy.value);
    params.append('sort_dir', sortDir.value);

    const data = await fetchJson<PendingResponse>(`/pending?${params.toString()}`);
    pendingItems.value = data.uploads;
    totalItems.value = data.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
  } finally {
    if (isInitialLoad) {
      loading.value = false;
    }
    refreshing.value = false;
  }
}

onMounted(() => {
  fetchPendingItems();

  const pendingItemId = getPendingItemIdFromUrl();
  if (pendingItemId !== null) {
    openPendingItemById(pendingItemId, true);
  }
});

function handlePopState(ev: PopStateEvent) {
  const state = ev.state as any;

  if (state && typeof state.pendingItemId === 'number') {
    openPendingItemById(state.pendingItemId, false);
  } else {
    selectedItem.value = null;
    selectedItemFromDirectLink.value = false;
  }
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
  updatePendingItemUrl(null, true);
});

async function thumbnailAction(id: number, accept: boolean) {
  if (!selectedItem.value || fullscreenLoading.value) return;
  if (!accept) {
    if (rejectReason.value.trim() === "") {
      rejectReasonField.value!.focus();
      return;
    }
  }

  if (accept) {
    if (settings.confirm_accept) {
      if (!await confirmModal(
        'Confirm Accept',
        'Are you sure you want to accept this thumbnail?',
      )) return;
    }
  } else {
    if (settings.confirm_reject) {
      if (!await confirmModal(
        'Confirm Reject',
        'Are you sure you want to reject this thumbnail?',
      )) return;
    }
  }

  fullscreenLoading.value = true;

  try {
    const response = await fetch(`/pending/${id}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        accepted: accept,
        reason: accept ? null : rejectReason.value.trim()
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to process thumbnail action');
    }

    await fetchPendingItems();
    closeItem();
  } catch (err) {
    await alertModal(
      'Thumbnail Action',
      'An error occurred while processing the thumbnail action: ' + (err instanceof Error ? err.message : 'Unknown error')
    );
  } finally {
    fullscreenLoading.value = false;
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function goToFirstPage() {
  currentPage.value = 1;
}

function goToLastPage() {
  currentPage.value = totalPages.value;
}

function handlePageInputChange() {
  const page = parseInt(pageInput.value, 10);
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    pageInput.value = "";
  }
}

function sanitizeLevelIdInput() {
  filterLevelId.value = filterLevelId.value.replace(/[^0-9]/g, '');
}

function openItem(item: PendingItem) {
  try {
    updatePendingItemUrl(item.id, false);
  } catch (e) {
    // ignore
  }

  error.value = null;
  selectedItem.value = item;
  selectedItemFromDirectLink.value = false;
}

function closeItem() {
  if (selectedItemFromDirectLink.value) {
    updatePendingItemUrl(null, true);
    selectedItem.value = null;
    selectedItemFromDirectLink.value = false;
    return;
  }

  try {
    history.back();
  } catch (e) {
    updatePendingItemUrl(null, true);
    selectedItem.value = null;
  }
}

function secToMinSec(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return `${mins}:${secs.padStart(5, '0')}`;
}

function roleIcon(role: string) {
  switch (role) {
    case 'admin':
      return '/icons/admin.svg';
    case 'moderator':
      return '/icons/moderator.svg';
    case 'verified':
      return '/icons/verified-user.svg';
    default:
      return '/icons/user.svg';
  }
}

function formatModPlatform(platform: string | null, version: string | null): string {
  if (!platform || !version) return 'N/A';
  const platformMap: Record<string, string> = {
    'Windows': 'Windows',
    'Android64': 'Android',
    'Android32': 'Android 32-bit',
    'MacArm': 'macOS',
    'MacIntel': 'macOS Intel',
    'iOS': 'iOS'
  };
  return `${version} (${platformMap[platform] || platform})`;
}

</script>

<template>
  <div v-if="loading || directLinkLoading" class="d-flex flex-middle h-100">
    <LoadingCircle/>
  </div>
  <div v-else>
    <div v-if="error && pendingItems.length === 0" class="error-message">
      <img src="/error.svg" alt="Error Icon" style="width: 128px; height: auto;"/>
      <p>{{ error }}</p>
    </div>
    <div v-if="selectedItem" class="selected-item page-transition">
      <div class="d-flex w-100 justify-content-between align-items-center mb-1 flex-wrap gap-1">
        <button @click="closeItem()" class="btn btn-dark">&larr; Back To List</button>

        <div v-if="selectedItem!.replacement && originalThumbnailInfo" class="card">
          <span class="card-subtitle">Original By</span>
          <p class="card-text">
            <img src="/icons/user.svg" alt="Original Author" class="user-icon" />
            <span :title="`Account ID: ${originalThumbnailInfo.account_id}`">{{ originalThumbnailInfo.username }}</span>
            <img src="/icons/verified.svg" alt="Creator Badge" class="user-icon" style="margin-left: 4px;" v-if="originalThumbnailInfo.account_id && selectedItem!.note_data?.creator_id === originalThumbnailInfo.account_id" />
          </p>
        </div>
        <div v-else-if="selectedItem!.replacement && originalThumbnailLoading" class="card">
          <span class="card-subtitle">Original By</span>
          <p class="card-text">Loading...</p>
        </div>

        <div class="card">
          <span class="card-subtitle">Submitted By</span>
          <p class="card-text">
            <img :src="roleIcon(selectedItem!.user_role)" :alt="selectedItem!.user_role" class="user-icon" />
            <span :title="`User ID: ${selectedItem!.user_id}`">{{ selectedItem!.username }}</span>
            <img src="/icons/verified.svg" alt="Creator Badge" class="user-icon" style="margin-left: 4px;" v-if="selectedItem!.account_id && selectedItem!.note_data?.creator_id === selectedItem!.account_id" />
            <span v-if="selectedItem!.replacement" class="subtitle user-icon">&bullet; Replacement</span>
          </p>
        </div>
      </div>

      <div class="info-grid mb-1">
        <div class="card info-main">
          <div class="card-submission-note">
            <div class="p-05">
              <DifficultyFace 
                :difficulty="selectedItem!.note_data?.difficulty || 'NA'"
                :stars="selectedItem!.note_data?.stars || 0"
                :rate="selectedItem!.note_data?.rating || 'NA'"
                :moons="selectedItem!.note_data?.length == 'Plat' || false"
                :size="64" />
            </div>
            <div class="card-content">
              <p class="card-text">
                <span class="main-text">
                  {{ selectedItem!.note_data?.level_name || 'Unknown Level' }}
                  <br/>
                </span>
                <span class="subtitle">
                  ID: {{ selectedItem!.level_id }}
                  <br/>
                </span>
                <span v-if="selectedItem!.note_data?.creator_name" :title="`ID: ${selectedItem!.note_data.creator_id}`" class="stat-row-label">
                  <img src="/icons/user.svg" alt="Creator" />
                  {{ selectedItem!.note_data?.creator_name }}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div class="card info-side">
          <span class="card-subtitle">Level Statistics</span>
          <p class="card-text">
            <p v-if="selectedItem!.note_data && selectedItem!.note_data.downloads != null" class="card-stat-row">
              <span class="stat-row-label">
                <img src="/icons/download.svg" alt="Download Icon" />
                Downloads
              </span>
              <span class="stat-row-value">
                {{ selectedItem!.note_data!.downloads!.toLocaleString() }}<br/>
              </span>
            </p>
            <p v-if="selectedItem!.note_data && selectedItem!.note_data.likes != null" class="card-stat-row">
              <span class="stat-row-label">
                <img src="/icons/like.svg" alt="Like Icon" />
                Likes
              </span>
              <span class="stat-row-value">
                {{ selectedItem!.note_data!.likes!.toLocaleString() }}<br/>
              </span>
            </p>
            <p v-if="selectedItem!.note_data?.length" class="card-stat-row">
              <span class="stat-row-label">
                <img src="/icons/clock.svg" alt="Clock Icon" />
                Length
              </span>
              <span class="stat-row-value">
                {{ selectedItem!.note_data.length }}<br/>
              </span>
            </p>
          </p>
        </div>
        <div class="card info-side">
          <span class="card-subtitle">Screenshot Details</span>
          <p class="card-text">
            <p class="card-stat-row">
              <span class="stat-row-label">
                <img src="/icons/calendar.svg" alt="Calendar Icon" />
                Uploaded On
              </span>
              <span class="stat-row-value date-value" :title="new Date(selectedItem!.upload_time).toLocaleString()">
                {{ new Date(selectedItem!.upload_time).toLocaleString() }}
              </span>
            </p>

            <p class="card-stat-row" v-if="selectedItem!.note_data && selectedItem!.note_data.attempt_time != null">
              <span class="stat-row-label">
                <img src="/icons/timer.svg" alt="Clock Icon" />
                Attempt Time
              </span>
              <span class="stat-row-value">
                {{ secToMinSec(selectedItem!.note_data.attempt_time) }}
              </span>
            </p>
  
            <p class="card-stat-row" v-if="selectedItem!.note_data && selectedItem!.note_data.percentage != null">
              <span class="stat-row-label">
                <img src="/icons/percent.svg" alt="Progress Icon" />
                Progress
              </span>
              <span class="stat-row-value">
                {{ selectedItem!.note_data.percentage.toFixed(2) }}%
              </span>
            </p>

            <p class="card-stat-row" v-if="selectedItem!.note_data?.mod_platform && selectedItem!.note_data?.mod_version">
              <span class="stat-row-label">
                <img src="/icons/gear.svg" alt="Platform Icon" />
                Mod Version
              </span>
              <span class="stat-row-value">
                {{ formatModPlatform(selectedItem!.note_data.mod_platform, selectedItem!.note_data.mod_version) }}
              </span>
            </p>
          </p>
        </div>
      </div>

      <div class="w-100 px-1">
        <div class="card card-submission-note mb-1" v-if="selectedItem!.note_data?.message">
          <img src="/icons/chat.svg" alt="Note Icon" class="card-icon" />
          <div class="card-content">
            <span class="card-subtitle">Submission Note</span>
            <p class="card-text">{{ selectedItem!.note_data.message }}</p>
          </div>
        </div>
      </div>

      <ImageDiffer
          :src-a="`/pending/${selectedItem!.id}/image`"
          :src-b="selectedItem!.replacement ? `/thumbnail/${selectedItem!.level_id}` : undefined"
      />
      <div class="filler"></div>

      <div class="w-100 px-1 mt-1">
        <div class="card card-submission-note flex-col">
          <span class="subtitle-2">Rejection Reason</span>

          <div class="d-flex justify-content-start gap-05 flex-wrap">
            <button @click="rejectReason = preset" class="btn-sm btn-secondary" v-for="preset in REJECT_PRESETS" :key="preset">
              {{ preset }}
            </button>
          </div>
          
          <div class="w-100 d-flex">
            <textarea v-model="rejectReason" ref="rejectReasonField" class="form-control flex-1" 
              placeholder="Enter reason for rejection here..." rows="3" 
              :disabled="fullscreenLoading">
            </textarea>
          </div>
          
          <div class="d-flex w-100 gap-1">
            <button @click="thumbnailAction(selectedItem!.id, false)" class="btn btn-danger flex-1">
              <img src="/icons/cross.svg" alt="Reject Icon" style="vertical-align: middle; margin-right: 4px;" />
              Reject
            </button>
            <button @click="thumbnailAction(selectedItem!.id, true)" class="btn btn-success flex-1">
              <img src="/icons/check.svg" alt="Accept Icon" style="vertical-align: middle; margin-right: 4px;" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="page-transition">
      <div class="filters-container search-panel">
        <div class="search-panel-header">
          <div>
            <span class="panel-kicker">Pending Queue</span>
          </div>
          <div class="filter-results">
            Total {{ totalItems }} items
            <img src="/icons/refresh.svg" alt="Refresh Icon" class="refresh-icon" @click="fetchPendingItems()"/>
          </div>
        </div>

        <div class="filters-grid">
          <div class="filter-item">
            <label for="filterReplacement">Type:</label>
            <select
                id="filterReplacement"
                v-model="filterReplacement"
                class="form-control"
            >
              <option value="all">All</option>
              <option value="replacement">Replacements Only</option>
              <option value="new">New Only</option>
            </select>
          </div>
          <div class="filter-item">
            <label for="sortBy">Sort by:</label>
            <select
                id="sortBy"
                v-model="sortBy"
                class="form-control"
            >
              <option value="upload_time">Upload Time</option>
              <option value="level_id">Level ID</option>
              <option value="level_name">Level Name</option>
              <option value="creator_name">Creator Name</option>
              <option value="username">Uploader</option>
              <option value="stars">Stars</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div class="filter-item">
            <label for="sortDir">Direction:</label>
            <select
                id="sortDir"
                v-model="sortDir"
                class="form-control"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div class="filter-item">
            <label for="itemsPerPage">Items per page:</label>
            <select
                id="itemsPerPage"
                v-model.number="itemsPerPage"
                class="form-control"
            >
              <option :value="12">12</option>
              <option :value="24">24</option>
              <option :value="36">36</option>
              <option :value="48">48</option>
              <option :value="60">60</option>
              <option :value="96">96</option>
            </select>
          </div>
          <div class="filter-item">
            <label for="filterUsername">Username:</label>
            <input
                id="filterUsername"
                type="text"
                v-model="filterUsername"
                class="form-control"
                placeholder="Search by username"
            />
          </div>
          <div class="filter-item">
            <label for="filterSearch">Level / creator:</label>
            <input
                id="filterSearch"
                type="text"
                v-model="filterSearch"
                class="form-control"
                placeholder="Search level or creator"
            />
          </div>
          <div class="filter-item">
            <label for="filterLevelId">Level ID:</label>
            <input
                id="filterLevelId"
                type="text"
                v-model="filterLevelId"
                @input="sanitizeLevelIdInput()"
                class="form-control"
                inputmode="numeric"
                pattern="[0-9]*"
                placeholder="Search by level ID"
            />
          </div>
          <label class="filter-item toggle-label">
            <span>Rated levels only</span>
            <span class="toggle-switch">
              <input v-model="filterRatedOnly" type="checkbox" />
              <span class="toggle-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="filter-item toggle-label">
            <span>Thumbnails from creator</span>
            <span class="toggle-switch">
              <input v-model="filterFromCreatorOnly" type="checkbox" />
              <span class="toggle-track" aria-hidden="true"></span>
            </span>
          </label>
        </div>

        <div v-if="totalPages > 1" class="pagination-container">
          <div class="pagination-controls">
            <button
                @click="goToFirstPage()"
                :disabled="currentPage === 1"
                class="btn btn-secondary btn-sm"
                title="First page"
            >
              <img src="/icons/first.svg" alt="⏮" class="nav-icon" />
            </button>

            <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="btn btn-secondary btn-sm"
            >
              <img src="/icons/previous.svg" alt="◂" class="nav-icon" />
            </button>

            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>

            <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="btn btn-secondary btn-sm"
            >
              <img src="/icons/next.svg" alt="▸" class="nav-icon" />
            </button>

            <button
                @click="goToLastPage()"
                :disabled="currentPage === totalPages"
                class="btn btn-secondary btn-sm"
                title="Last page"
            >
              <img src="/icons/last.svg" alt="⏭" class="nav-icon" />
            </button>

            <input
                type="number"
                v-model="pageInput"
                @keyup.enter="handlePageInputChange()"
                class="form-control pagination-input-field"
                placeholder="Go to page..."
                min="1"
                :max="totalPages"
            />
            <button
                @click="handlePageInputChange()"
                :disabled="pageInput === ''"
                class="btn btn-secondary btn-sm"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      <div v-if="totalItems === 0" class="text-center mt-2">
        <p>No pending items found in the database.</p>
      </div>
      <div v-else-if="filteredItems.length === 0" class="text-center mt-2">
        <p>No items match the current filters.</p>
      </div>
      <div v-else class="image-grid">
        <div v-for="item in paginatedItems" :key="item.id" class="image-item" @click="openItem(item)">
          <img :src="`/pending/${item.id}/image`" alt="Thumbnail" class="thumbnail-image" loading="lazy"/>
          <div class="thumbnail-info">
            {{ item.note_data?.level_name || 'Unknown Level' }} (ID: {{ item.level_id }})<br/>
            Submitted by {{ item.username }}<br/>
            <span v-if="item.replacement" class="replacement-badge">Replacement</span>
            <span v-if="item.note_data?.creator_id == item.account_id" class="creator-badge">Level Creator</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <LoadingCircle backdrop v-if="refreshing"/>
  <LoadingCircle backdrop v-if="fullscreenLoading"/>
</template>

<style scoped>
/* Entry viewer styles */

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1.25rem;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
}

.card-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.25rem;
}

.card-text {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem;
  vertical-align: middle
}

.card-text img {
  vertical-align: middle;
}

.subtitle {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr) minmax(260px, 1fr);
  gap: 12px;
  width: 100%;
}

.info-main {
  min-height: 64px;
  min-width: 0;
}

.info-side {
  min-height: 64px;
  min-width: 0;
}

.card-submission-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.card-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  margin-block-start: 0.25rem;
  margin-block-end: 0.25rem;
}

.stat-row-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.stat-row-value {
  font-weight: 500;
  font-size: 0.95rem;
  text-align: right;
}

.date-value {
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stat-row img {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
}

.subtitle-2 {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.user-icon {
  user-select: none;
}

textarea.form-control {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #fff;
  padding: 8px;
}

@container (max-width: 1100px) {
  .info-grid {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 1fr);
  }

  .info-main {
    grid-column: 1 / -1;
  }
}

@container (max-width: 760px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* General styles */

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  font-size: 1.2em;
}

.filters-container {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
}

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.search-panel h3 {
  margin: 2px 0 0;
  font-size: 1.25rem;
  line-height: 1.15;
}

.panel-kicker {
  display: inline-block;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-weight: 500;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.82);
}

.toggle-label {
  justify-content: flex-start;
  gap: 10px;
}

.toggle-label > span:first-child {
  font-weight: 500;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.82);
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 2px;
}

.toggle-switch input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
  transition: transform 0.18s ease, background 0.18s ease;
}

.toggle-switch input:checked + .toggle-track {
  background: rgba(78, 159, 255, 0.35);
  border-color: rgba(78, 159, 255, 0.75);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18), 0 0 0 3px rgba(78, 159, 255, 0.1);
}

.toggle-switch input:checked + .toggle-track::after {
  transform: translate(20px, -50%);
}

.toggle-switch input:focus-visible + .toggle-track {
  outline: none;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18), 0 0 0 3px rgba(78, 159, 255, 0.22);
}

.filter-results {
  text-align: right;
  font-size: 0.92rem;
  opacity: 0.82;
  white-space: nowrap;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 2fr));
  gap: 16px;
  margin: 24px 0;
}

.image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
  position: relative;
}

.image-item:hover {
  transform: scale(1.05);
}

.image-item:hover > .thumbnail-info {
  opacity: 1;
}

.thumbnail-info {
  padding: 8px;
  position: absolute;
  bottom: 0;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  width: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.replacement-badge {
  display: inline-block;
  background: rgba(255, 165, 0, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: bold;
  margin-top: 4px;
  margin-right: 4px;
}

.creator-badge {
  display: inline-block;
  background: rgba(30, 144, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: bold;
  margin-top: 4px;
}

.pagination-container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding: 14px 0 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pagination-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 0;
}

.pagination-input-field {
  width: 140px;
  padding: 8px 12px;
  max-height: 38px;
}

.page-info {
  margin: 0 10px;
  font-weight: 500;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.nav-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: middle;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.9em;
  border-radius: 10px;
}

.pagination-controls .btn-sm {
  min-width: 40px;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pagination-controls .btn-sm:not(:disabled):hover {
  transform: translateY(-1px);
}

.pagination-controls .btn-sm:disabled {
  opacity: 0.55;
}

.filters-container :deep(.form-control) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.filters-container :deep(.form-control::placeholder) {
  color: rgba(255, 255, 255, 0.45);
}

.filters-container :deep(.form-control:focus) {
  outline: none;
  border-color: rgba(78, 159, 255, 0.75);
  box-shadow: 0 0 0 3px rgba(78, 159, 255, 0.12);
}

.filters-container :deep(select.form-control) {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding-right: 2.5rem;
  background-image:
    linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.9) 50%),
    linear-gradient(135deg, rgba(255,255,255,0.9) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 3px),
    calc(100% - 12px) calc(50% - 3px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.filters-container :deep(select.form-control option) {
  background: #13263f;
  color: #fff;
}

.thumbnail-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.selected-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  height: 100%;
  container-type: inline-size;
}

.sensitive-actions {
  max-width: 800px;
}

.refresh-icon {
  vertical-align: sub;
  cursor: pointer;
  transition: transform 0.2s;
}

.refresh-icon:hover {
  transform: scale(1.1);
}

.sensitive-actions > div {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .filters-container {
    padding: 16px;
    border-radius: 16px;
  }

  .search-panel-header {
    flex-direction: column;
  }

  .filter-results {
    text-align: left;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .pagination-controls {
    font-size: 0.9em;
    flex-wrap: wrap;
    padding: 10px;
  }

  .page-info {
    margin: 0 8px;
    order: 10;
    width: 100%;
    text-align: center;
  }

  .pagination-input-field {
    width: 110px;
  }
}
</style>
