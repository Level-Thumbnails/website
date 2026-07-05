<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LoadingCircle from '../../components/LoadingCircle.vue';
import Modal from '../../components/Modal.vue';
import { fetchJson, unwrap } from '../../lib/utils';
import SessionManager from '../../managers/session';
import type { UserListResponse, UserRow } from '../../lib/types';
import type { ModalButton } from '../../components/Modal.vue';
import { alertModal, confirmModal } from '../../lib/modals';

type SortColumn = 'id' | 'username' | 'role' | 'total_uploads' | 'accepted' | 'pending' | 'rejected' | 'active_thumbnails';
type SortDirection = 'asc' | 'desc';
type UserRole = 'user' | 'verified' | 'moderator' | 'admin' | 'owner';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  verified: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
};

const loading = ref(true);
const refreshing = ref(false);
const error = ref<string | null>(null);

const users = ref<UserRow[]>([]);
const total = ref(0);

const currentUser = SessionManager.getUser();
const currentUserRole = currentUser?.role || 'user';

const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageInput = ref('');
const itemsPerPageOptions = [10, 25, 50, 100] as const;

const filterUsername = ref('');
const filterId = ref('');
const filterAccountId = ref('');
const filterDiscordId = ref('');
const filterRole = ref('');
const showBannedOnly = ref(false);

const sortBy = ref<SortColumn>('id');
const sortDirection = ref<SortDirection>('asc');

const copiedKey = ref<string | null>(null);
const roleChangeLoading = ref<number | null>(null);
const openRoleDropdown = ref<number | null>(null);
const openRoleDropdownUp = ref(false);
const roleDropdownPosition = ref<{ top: number; left: number; width: number } | null>(null);

const banModalOpen = ref(false);
const banModalUserId = ref<number | null>(null);
const banReason = ref('');
const banExpiryDate = ref('');
const banExpiryTime = ref('');
const banLoading = ref(false);

const banModalButtons = computed<ModalButton[]>(() => [
  {
    label: 'Cancel',
    variant: 'secondary',
    disabled: banLoading.value,
  },
  {
    label: banLoading.value ? 'Banning...' : 'Ban User',
    variant: 'danger',
    disabled: banLoading.value || !banReason.value.trim(),
    loading: banLoading.value,
  },
]);

let copiedTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const totalPages = computed(() =>
  total.value === 0 ? 0 : Math.ceil(total.value / itemsPerPage.value)
);

const hasBannedUsers = computed(() => users.value.some((user) => user.banned));

function canManageRoles(): boolean {
  return currentUserRole === 'moderator' || currentUserRole === 'admin' || currentUserRole === 'owner';
}

function canBanUser(user: UserRow): boolean {
  if (!canManageRoles()) return false;
  const targetHierarchy = ROLE_HIERARCHY[user.role];
  const myHierarchy = ROLE_HIERARCHY[currentUserRole];
  return targetHierarchy < myHierarchy || currentUserRole === 'owner';
}

function getAvailableRolesForUser(user: UserRow): UserRole[] {
  if (!canManageRoles()) return [];

  const targetHierarchy = ROLE_HIERARCHY[user.role];
  const myHierarchy = ROLE_HIERARCHY[currentUserRole];
  const isOwner = currentUserRole === 'owner';

  if (!isOwner && targetHierarchy >= myHierarchy) return [];

  const availableRoles: UserRole[] = [];
  const allRoles: UserRole[] = ['user', 'verified', 'moderator', 'admin', 'owner'];

  for (const role of allRoles) {
    const roleHierarchy = ROLE_HIERARCHY[role];

    if ((isOwner || roleHierarchy < myHierarchy) && roleHierarchy !== targetHierarchy) {
      availableRoles.push(role);
    }
  }

  return availableRoles;
}

const activeRoleTarget = computed(() =>
  openRoleDropdown.value === null
    ? null
    : users.value.find((u) => u.id === openRoleDropdown.value) ?? null
);

const activeRoleOptions = computed<UserRole[]>(() =>
  activeRoleTarget.value ? getAvailableRolesForUser(activeRoleTarget.value) : []
);

const roleDropdownStyle = computed(() => {
  if (!roleDropdownPosition.value) return {};
  return {
    top: `${roleDropdownPosition.value.top}px`,
    left: `${roleDropdownPosition.value.left}px`,
    minWidth: `${roleDropdownPosition.value.width}px`,
  };
});

function closeRoleDropdown() {
  openRoleDropdown.value = null;
  openRoleDropdownUp.value = false;
  roleDropdownPosition.value = null;
}

function setRoleDropdownPosition(anchor: HTMLElement, user: UserRow) {
  const rect = anchor.getBoundingClientRect();
  const optionsCount = Math.max(1, getAvailableRolesForUser(user).length);
  const estimatedHeight = (optionsCount * 34) + 20;
  const estimatedWidth = Math.max(140, Math.ceil(rect.width));
  const margin = 8;
  const gap = 4;

  const spaceBelow = window.innerHeight - rect.bottom;
  const shouldOpenUp = spaceBelow < estimatedHeight + gap && rect.top > spaceBelow;

  let top = shouldOpenUp
    ? rect.top - estimatedHeight - gap
    : rect.bottom + gap;

  top = Math.max(margin, Math.min(top, window.innerHeight - estimatedHeight - margin));

  let left = rect.left;
  left = Math.max(margin, Math.min(left, window.innerWidth - estimatedWidth - margin));

  openRoleDropdownUp.value = shouldOpenUp;
  roleDropdownPosition.value = {
    top,
    left,
    width: estimatedWidth,
  };
}

function toggleRoleDropdown(user: UserRow, event: MouseEvent) {
  if (openRoleDropdown.value === user.id) {
    closeRoleDropdown();
    return;
  }

  const trigger = event.currentTarget;
  if (!(trigger instanceof HTMLElement)) {
    openRoleDropdown.value = user.id;
    return;
  }

  openRoleDropdown.value = user.id;
  setRoleDropdownPosition(trigger, user);
}

async function changeUserRole(userId: number, newRole: UserRole) {
  roleChangeLoading.value = userId;

  if (!await confirmModal(
    'Change User Role',
    `Are you sure you want to change ${users.value.find(u => u.id === userId)?.username}'s role to "${newRole}"?`
  )) {
    roleChangeLoading.value = null;
    return;
  }

  closeRoleDropdown();

  try {
    const res = await fetchJson(`/admin/user/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    const updatedUser = unwrap<UserRow>(res);
    const index = users.value.findIndex(u => u.id === userId);
    if (index !== -1) {
      users.value[index].role = updatedUser.role;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to change user role';
    await alertModal('Change User Role', `Error: ${message}`);
  } finally {
    roleChangeLoading.value = null;
  }
}

function buildParams(): URLSearchParams {
  const p = new URLSearchParams({
    page: String(currentPage.value),
    per_page: String(itemsPerPage.value),
    sort_by: sortBy.value,
    sort_dir: sortDirection.value,
  });
  if (filterUsername.value.trim()) p.append('username', filterUsername.value.trim());
  if (filterId.value.trim()) p.append('id', filterId.value.trim());
  if (filterAccountId.value.trim()) p.append('account_id', filterAccountId.value.trim());
  if (filterDiscordId.value.trim()) p.append('discord_id', filterDiscordId.value.trim());
  if (filterRole.value) p.append('role', filterRole.value);
  if (showBannedOnly.value) p.append('banned', 'true');
  return p;
}

async function fetchUsers() {
  const initial = loading.value && users.value.length === 0;
  if (!initial) refreshing.value = true;
  error.value = null;

  try {
    const payload = await fetchJson<unknown>(`/admin/users?${buildParams()}`);
    const data = unwrap<UserListResponse>(payload);
    users.value = data.users;
    total.value = data.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
  } finally {
    if (initial) loading.value = false;
    refreshing.value = false;
  }
}

function scheduleFetch() {
  currentPage.value = 1;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchUsers, 400);
}

watch([filterUsername, filterId, filterAccountId, filterDiscordId, filterRole, showBannedOnly], scheduleFetch);
watch(itemsPerPage, () => { currentPage.value = 1; fetchUsers(); });
watch(currentPage, fetchUsers);

function handleDocumentClick(event: MouseEvent) {
  if (openRoleDropdown.value === null) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  if (!target.closest('.role-cell') && !target.closest('.role-dropdown-portal')) {
    closeRoleDropdown();
  }
}

onMounted(() => {
  fetchUsers();
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', closeRoleDropdown);
  window.addEventListener('scroll', closeRoleDropdown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', closeRoleDropdown);
  window.removeEventListener('scroll', closeRoleDropdown, true);
  if (copiedTimer) clearTimeout(copiedTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
});

function toggleSort(col: SortColumn) {
  if (sortBy.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = col;
    sortDirection.value = (col === 'id' || col === 'username') ? 'asc' : 'desc';
  }
  fetchUsers();
}

function sortIcon(col: SortColumn) {
  if (sortBy.value !== col) return '/icons/ascending.svg';
  return sortDirection.value === 'asc' ? '/icons/ascending.svg' : '/icons/descending.svg';
}

function roleIcon(role: UserRow['role']): string {
  const map: Record<UserRow['role'], string> = {
    user: '/icons/user.svg',
    verified: '/icons/verified-user.svg',
    moderator: '/icons/moderator.svg',
    admin: '/icons/admin.svg',
    owner: '/icons/owner.svg',
  };
  return map[role];
}

async function copyToClipboard(text: string, key: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = Object.assign(document.createElement('textarea'), {
        value: text,
        readOnly: true,
      });
      Object.assign(el.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    copiedKey.value = key;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null;
    }, 1200);
  } catch { /* ignore */ }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
}

function handlePageInput() {
  const page = parseInt(pageInput.value, 10);
  if (!Number.isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    pageInput.value = '';
  }
}

function formatBanDate(value: string | null): string {
  if (!value) return '—';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const hasTimezone = /([zZ]|[+-]\d\d:?\d\d)$/.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function openBanModal(userId: number) {
  banModalUserId.value = userId;
  banModalOpen.value = true;
  banReason.value = '';
  banExpiryDate.value = '';
  banExpiryTime.value = '';
}

function closeBanModal() {
  banModalOpen.value = false;
  banModalUserId.value = null;
  banReason.value = '';
  banExpiryDate.value = '';
  banExpiryTime.value = '';
  banLoading.value = false;
}

async function handleBanAction(actionIndex: number) {
  if (actionIndex === 0) {
    closeBanModal();
    return;
  }

  if (!banModalUserId.value || !banReason.value.trim()) {
    await alertModal('Ban User', 'Please provide a ban reason');
    return;
  }

  const user = users.value.find(u => u.id === banModalUserId.value);
  if (!user) return;

  if (!await confirmModal('Ban User', `Are you sure you want to ban ${user.username}?`)) {
    return;
  }

  banLoading.value = true;

  try {
    let expiresBy = null;
    if (banExpiryDate.value) {
      const expiryDateTime = new Date(`${banExpiryDate.value}T${banExpiryTime.value || '00:00'}:00Z`);
      expiresBy = expiryDateTime.toISOString();
    }

    await fetchJson(`/admin/ban/${banModalUserId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: banReason.value.trim(),
        expires_by: expiresBy,
      }),
    });

    const index = users.value.findIndex(u => u.id === banModalUserId.value);
    if (index !== -1) {
      users.value[index].banned = true;
    }

    closeBanModal();
    await alertModal('Ban User', 'User banned successfully');
    fetchUsers();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to ban user';
    await alertModal('Ban User', `Error: ${message}`);
  } finally {
    banLoading.value = false;
  }
}

async function unbanUser(userId: number) {
  const user = users.value.find(u => u.id === userId);
  if (!user) return;

  if (!await confirmModal('Unban User', `Are you sure you want to unban ${user.username}?`)) {
    return;
  }

  banLoading.value = true;

  try {
    await fetchJson(`/admin/ban/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const index = users.value.findIndex(u => u.id === userId);
    if (index !== -1) {
      users.value[index].banned = false;
    }

    await alertModal('Unban User', 'User unbanned successfully');
    fetchUsers();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to unban user';
    await alertModal('Unban User', `Error: ${message}`);
  } finally {
    banLoading.value = false;
  }
}
</script>

<template>
  <div v-if="loading" class="centered-fill">
    <LoadingCircle />
  </div>

  <div v-else class="users-page">
    <div v-if="error && users.length === 0" class="error-state">
      <img src="/error.svg" alt="Error" class="error-img" />
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <section class="panel">
        <header class="panel-header">
          <span class="panel-kicker">Users</span>
          <span class="panel-count">Total {{ total }}</span>
        </header>

        <div class="filters-grid">
          <label class="filter-label">
            Username
            <input v-model="filterUsername" class="ctrl" type="text" placeholder="Search by username" />
          </label>
          <label class="filter-label">
            User ID
            <input v-model="filterId" class="ctrl" type="text" inputmode="numeric" placeholder="Search by user ID" />
          </label>
          <label class="filter-label">
            GD Account ID
            <input v-model="filterAccountId" class="ctrl" type="text" inputmode="numeric"
              placeholder="Search by GD account ID" />
          </label>
          <label class="filter-label">
            Discord ID
            <input v-model="filterDiscordId" class="ctrl" type="text" inputmode="numeric"
              placeholder="Search by Discord ID" />
          </label>
          <label class="filter-label">
            Role
            <select v-model="filterRole" class="ctrl select">
              <option value="">Any</option>
              <option value="user">user</option>
              <option value="verified">verified</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
          </label>
          <label class="filter-label toggle-label">
            <span>Banned users only</span>
            <span class="toggle-switch">
              <input v-model="showBannedOnly" type="checkbox" />
              <span class="toggle-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="filter-label">
            Per page
            <select v-model.number="itemsPerPage" class="ctrl select">
              <option v-for="n in itemsPerPageOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>

        <nav v-if="totalPages > 1" class="pagination">
          <button class="btn btn-secondary btn-sm" title="First page" :disabled="currentPage === 1"
            @click="goToPage(1)">
            <img src="/icons/first.svg" alt="⏮" class="nav-icon" />
          </button>
          <button class="btn btn-secondary btn-sm" title="Previous page" :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)">
            <img src="/icons/previous.svg" alt="◂" class="nav-icon" />
          </button>

          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>

          <button class="btn btn-secondary btn-sm" title="Next page" :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)">
            <img src="/icons/next.svg" alt="▸" class="nav-icon" />
          </button>
          <button class="btn btn-secondary btn-sm" title="Last page" :disabled="currentPage === totalPages"
            @click="goToPage(totalPages)">
            <img src="/icons/last.svg" alt="⏭" class="nav-icon" />
          </button>

          <input v-model="pageInput" class="ctrl page-input" type="number" placeholder="Go to…" min="1"
            :max="totalPages" @keyup.enter="handlePageInput" />
          <button class="btn btn-secondary btn-sm" :disabled="!pageInput" @click="handlePageInput">Go</button>
        </nav>
      </section>

      <div class="table-wrap">
        <table class="users-table">
          <thead>
            <tr>
              <th v-for="col in ([
                { key: 'id', label: 'ID' },
                { key: 'username', label: 'User' },
                { key: 'role', label: 'Role' },
                { key: 'total_uploads', label: 'Uploads' },
                { key: 'accepted', label: 'Accepted' },
                { key: 'pending', label: 'Pending' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'active_thumbnails', label: 'Active' },
              ] as const)" :key="col.key">
                <button class="sort-btn" @click="toggleSort(col.key)">
                  {{ col.label }}
                  <img :src="sortIcon(col.key)" :class="['sort-icon', { active: sortBy === col.key }]" alt="" />
                </button>
              </th>
              <th v-if="hasBannedUsers">Ban Details</th>
              <th class="actions-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><span class="mono">{{ u.id }}</span></td>

              <td>
                <div class="user-cell">
                  <span class="username">{{ u.username }}</span>
                  <div v-if="u.banned" class="ban-badge" title="This user is banned">Banned</div>
                  <div class="meta-icons">
                    <button v-if="u.account_id !== -1" class="icon-btn" :title="`GD account ID: ${u.account_id}`"
                      @click="copyToClipboard(String(u.account_id), `account:${u.id}`)">
                      <img :src="copiedKey === `account:${u.id}` ? '/icons/copied.svg' : '/icons/dash.svg'" alt="GD"
                        class="icon-sm" />
                    </button>
                    <button v-if="u.discord_id" class="icon-btn" :title="`Discord ID: ${u.discord_id}`"
                      @click="copyToClipboard(u.discord_id, `discord:${u.id}`)">
                      <img :src="copiedKey === `discord:${u.id}` ? '/icons/copied.svg' : '/icons/discord.svg'"
                        alt="Discord" class="icon-sm" />
                    </button>
                  </div>
                </div>
              </td>

              <td>
                <div class="role-cell">
                  <button
                    v-if="getAvailableRolesForUser(u).length > 0"
                    class="role-pill"
                    :class="`role-${u.role}`"
                    :disabled="roleChangeLoading === u.id"
                    @click="toggleRoleDropdown(u, $event)"
                    :title="roleChangeLoading === u.id ? 'Changing role...' : 'Click to change role'"
                  >
                    <img :src="roleIcon(u.role)" :alt="u.role" class="icon-sm" />
                    {{ u.role }}
                    <span v-if="roleChangeLoading !== u.id" class="dropdown-arrow">▼</span>
                  </button>
                  <span v-else class="role-pill" :class="`role-${u.role}`">
                    <img :src="roleIcon(u.role)" :alt="u.role" class="icon-sm" />
                    {{ u.role }}
                  </span>

                </div>
              </td>

              <td>{{ u.total_uploads }}</td>
              <td>{{ u.accepted }}</td>
              <td>{{ u.pending }}</td>
              <td>{{ u.rejected }}</td>
              <td>{{ u.active_thumbnails }}</td>

              <td v-if="hasBannedUsers">
                <div v-if="u.banned" class="ban-info">
                  <div class="ban-info-line"><span class="ban-label">Reason:</span> {{ u.ban_reason || '—' }}</div>
                  <div class="ban-info-line"><span class="ban-label">By:</span> {{ u.banned_by_username || '—' }}</div>
                  <div class="ban-info-line"><span class="ban-label">Banned:</span> {{ formatBanDate(u.ban_time) }}</div>
                  <div class="ban-info-line"><span class="ban-label">Expires:</span> {{ u.ban_expires_at ? formatBanDate(u.ban_expires_at) : 'Never' }}</div>
                </div>
                <span v-else class="ban-info-empty">—</span>
              </td>

              <td class="actions-th">
                <button
                  v-if="canBanUser(u)"
                  class="btn btn-sm"
                  :class="u.banned ? 'btn-secondary' : 'btn-danger'"
                  :disabled="banLoading && banModalUserId === u.id"
                  @click="u.banned ? unbanUser(u.id) : openBanModal(u.id)"
                  :title="u.banned ? 'Unban this user' : 'Ban this user'"
                >
                  <img :src="u.banned ? '/icons/cancel.svg' : '/icons/ban.svg'" alt="" class="icon-sm" />
                </button>
                <button v-else class="btn btn-dark btn-sm" disabled>—</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Teleport to="body">
        <div
          v-if="activeRoleTarget && activeRoleOptions.length > 0"
          class="role-dropdown role-dropdown-portal"
          :class="{ 'open-up': openRoleDropdownUp }"
          :style="roleDropdownStyle"
        >
          <button
            v-for="role in activeRoleOptions"
            :key="role"
            class="role-option"
            :disabled="roleChangeLoading === activeRoleTarget.id"
            @click="changeUserRole(activeRoleTarget.id, role)"
          >
            <img :src="roleIcon(role)" :alt="role" class="icon-sm" />
            {{ role }}
          </button>
        </div>
      </Teleport>

      <Modal
        :open="banModalOpen"
        :title="`Ban ${users.find(u => u.id === banModalUserId)?.username || 'User'}`"
        :buttons="banModalButtons"
        @close="closeBanModal"
        @action="handleBanAction"
      >
        <label class="form-label">
          Ban Reason
          <textarea
            v-model="banReason"
            class="ctrl textarea"
            placeholder="Enter the reason for banning this user"
            rows="3"
            :disabled="banLoading"
          />
        </label>

        <label class="form-label">
          Expiry Date (Optional)
          <input
            v-model="banExpiryDate"
            type="date"
            class="ctrl"
            :disabled="banLoading"
          />
        </label>

        <label v-if="banExpiryDate" class="form-label">
          Expiry Time
          <input
            v-model="banExpiryTime"
            type="time"
            class="ctrl"
            :disabled="banLoading"
          />
        </label>
      </Modal>

    </template>
  </div>

  <LoadingCircle v-if="refreshing" backdrop />
</template>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  width: 100%;
}

.centered-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  text-align: center;
  font-size: 1.1rem;
}

.error-img {
  width: 128px;
  height: auto;
}

.panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-kicker {
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.panel-count {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.filter-label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.86rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.toggle-label {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  min-height: 0;
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

.ctrl {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 10px;
  padding: 7px 11px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ctrl::placeholder {
  color: rgba(255, 255, 255, 0.38);
}

.ctrl:focus {
  outline: none;
  border-color: rgba(78, 159, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(78, 159, 255, 0.12);
}

.ctrl.select {
  cursor: pointer;
  appearance: none;
  padding-right: 2.2rem;
  background-image:
    linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.85) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.85) 50%, transparent 50%);
  background-position:
    calc(100% - 17px) calc(50% - 2px),
    calc(100% - 11px) calc(50% - 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.ctrl.select option {
  background: #13263f;
  color: #fff;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.page-info {
  margin: 0 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.page-input {
  width: 130px;
  padding: 7px 10px;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
}

.users-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 10px 14px;
  vertical-align: middle;
  white-space: nowrap;
}

.users-table thead th {
  text-align: left;
  color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.users-table tbody td {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.users-table tbody tr:nth-child(even) {
  background: rgba(0, 0, 0, 0.10);
}

.users-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.sort-icon {
  width: 14px;
  height: 14px;
  opacity: 0.25;
  transition: opacity 0.15s;
}

.sort-icon.active {
  opacity: 1;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.meta-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.icon-btn:active {
  transform: none;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
  box-shadow: none;
}

.icon-sm {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: capitalize;
  border: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}

.role-pill:not(:disabled) {
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.role-pill:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.role-pill:disabled {
  opacity: 0.6;
  cursor: default;
}

.dropdown-arrow {
  font-size: 0.6rem;
  margin-left: 2px;
  opacity: 0.7;
}

.role-cell {
  position: relative;
  display: inline-block;
}

.role-dropdown {
  position: fixed;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  min-width: 140px;
}

.role-dropdown.open-up {
  transform-origin: bottom left;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}

.role-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.role-option:disabled {
  opacity: 0.5;
  cursor: default;
}

.role-user {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}

.role-verified {
  background: rgba(77, 214, 141, 0.16);
  color: #a4f2c8;
}

.role-moderator {
  background: rgba(102, 204, 255, 0.16);
  color: #b9ecff;
}

.role-admin {
  background: rgba(255, 109, 109, 0.16);
  color: #ffb8b8;
}

.role-owner {
  background: rgba(255, 193, 7, 0.18);
  color: #ffe0a3;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace;
}

.actions-th {
  width: 120px;
  text-align: center;
}

.ban-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 280px;
  white-space: normal;
  line-height: 1.35;
}

.ban-info-line {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.84);
}

.ban-label {
  color: rgba(255, 255, 255, 0.56);
  font-weight: 700;
}

.ban-info-empty {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.85rem;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.88rem;
  border-radius: 10px;
  min-width: 38px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s, opacity 0.12s;
}

.btn-sm:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-sm:disabled {
  opacity: 0.5;
}

.nav-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.ban-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  background: rgba(255, 109, 109, 0.2);
  color: #ffb8b8;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 4px;
  white-space: nowrap;
}

.btn-danger {
  background: rgba(255, 109, 109, 0.15);
  color: #ffb8b8;
  border: 1px solid rgba(255, 109, 109, 0.3);
}

.btn-danger:not(:disabled):hover {
  background: rgba(255, 109, 109, 0.25);
  border-color: rgba(255, 109, 109, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-dark {
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

@media (max-width: 640px) {
  .panel {
    padding: 14px 16px;
  }

  .users-table th,
  .users-table td {
    padding: 9px 10px;
  }
}
</style>