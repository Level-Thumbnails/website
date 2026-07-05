export interface UserStats {
  id: number;
  account_id: number;
  username: string;
  role: 'user' | 'verified' | 'moderator' | 'admin' | 'owner';
  upload_count: number;
  accepted_upload_count: number;
  pending_upload_count: number;
  level_count: number;
  accepted_level_count: number;
  active_thumbnail_count: number;
}

export interface StatsResponse {
  storage: number;
  thumbnails: number;
  users_per_month: number;
  users_total: number;
  uploads_total: number;
  pending_uploads_total: number;
  accepted_uploads_total: number;
  total_levels: number;
  current_pending_uploads: number;
  online_moderators: string[];
}

export interface UserHistoryPoint {
  period: string;
  upload_count: number;
  accepted_upload_count: number;
  pending_upload_count: number;
  level_count: number;
  accepted_level_count: number;
}

export interface StatsHistoryPoint {
  captured_at: string;
  storage_bytes: number;
  thumbnails_count: number;
  users_per_month: number | null;
  users_total: number;
  uploads_total: number;
  pending_uploads_total: number;
  accepted_uploads_total: number;
}

export interface ServerSettings {
  pause_submissions: boolean;
  min_supported_client: string;
}

export const RATING_NAMES = ['NA', 'Rated', 'Featured', 'Epic', 'Legendary', 'Mythic'] as const;
export const DIFFICULTY_NAMES = ['NA', 'Auto', 'Easy', 'Normal', 'Hard', 'Harder', 'Insane', 'EasyDemon', 'MediumDemon', 'HardDemon', 'InsaneDemon', 'ExtremeDemon'] as const;
export const LENGTH_NAMES = ['Tiny', 'Short', 'Medium', 'Long', 'XL', 'Plat'] as const;

export interface NoteData {
  attempt_time: number,
  creator_id: number,
  creator_name: string,
  difficulty: 'NA' | 'Auto' | 'Easy' | 'Normal' | 'Hard' | 'Harder' | 'Insane' | 'EasyDemon' | 'MediumDemon' | 'HardDemon' | 'InsaneDemon' | 'ExtremeDemon',
  downloads: number,
  length: 'Tiny' | 'Short' | 'Medium' | 'Long' | 'XL' | 'Plat',
  level_name: string,
  likes: number,
  message: string | null,
  mod_platform: 'Windows' | 'Android64' | 'Android32' | 'MacIntel' | 'MacArm' | 'iOS' | null,
  mod_version: string | null,
  percentage: number,
  rating: 'NA' | 'Rated' | 'Featured' | 'Epic' | 'Legendary' | 'Mythic',
  stars: number
}

export interface PendingItem {
  id: number;
  user_id: number;
  username: string;
  level_id: number;
  accepted: boolean;
  replacement: boolean;
  upload_time: string;
  submission_note: string | null;
  account_id: number | null;
  user_role: 'user' | 'verified' | 'moderator' | 'admin' | 'owner';
  note_data: NoteData | null;
}

export interface OriginalThumbnailInfo {
  level_id: number;
  account_id: number;
  username: string;
  upload_time: string;
  first_upload_time: string;
  accepted_time: string | null;
  accepted_by: number | null;
  accepted_by_username: string | null;
}

export interface PendingResponse {
  uploads: PendingItem[];
  page: number;
  per_page: number;
  total: number;
}

export interface MyThumbnailActiveItem {
  id: number;
  level_id: number;
  upload_time: string;
  accepted_time: string | null;
  note_data: NoteData | null;
}

export interface MyThumbnailRejectedItem {
  id: number;
  level_id: number;
  upload_time: string;
  accepted_time: string | null;
  note_data: NoteData | null;
  reason: string | null;
  accepted_by_username: string | null;
}

export interface MyUploadsSummaryResponse {
  active: number;
  pending: number;
  rejected: number;
}

export interface UserRow {
  id: number;
  username: string;
  account_id: number;
  discord_id: string | null;
  role: 'user' | 'verified' | 'moderator' | 'admin' | 'owner';
  total_uploads: number;
  accepted: number;
  pending: number;
  rejected: number;
  active_thumbnails: number;
  banned: boolean;
  ban_time: string | null;
  ban_reason: string | null;
  ban_expires_at: string | null;
  banned_by_username: string | null;
}

export interface UserListResponse {
  users: UserRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}