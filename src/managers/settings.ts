export interface UserSettings {
    confirm_accept: boolean;
    confirm_reject: boolean;
    replacement_filter: 'all' | 'replacement' | 'new';
    pending_per_page: number;
    pending_sort_by: 'upload_time' | 'level_id' | 'level_name' | 'creator_name' | 'username' | 'stars' | 'rating';
    pending_sort_dir: 'asc' | 'desc';
    pending_rated_only: boolean;
    pending_from_creator_only: boolean;
}

export default class SettingsManager {
    public static getDefaultSettings(): UserSettings {
        return {
            confirm_accept: false,
            confirm_reject: false,
            replacement_filter: 'all',
            pending_per_page: 12,
            pending_sort_by: 'upload_time',
            pending_sort_dir: 'asc',
            pending_rated_only: false,
            pending_from_creator_only: false,
        };
    }

    public static getSettings(): UserSettings {
        const settings = localStorage.getItem('settings');
        const parsedSettings = settings ? JSON.parse(settings) : null;
        if (parsedSettings) {
            const defaultSettings = SettingsManager.getDefaultSettings();

            const validateBool = (value: any, defaultValue: boolean): boolean => {
                return typeof value === 'boolean' ? value : defaultValue;
            }

            const validateNumber = (value: any, defaultValue: number): number => {
                return typeof value === 'number' && value > 0 ? value : defaultValue;
            }

            const pendingSortByOptions = ['upload_time', 'level_id', 'level_name', 'creator_name', 'username', 'stars', 'rating'];
            const pendingSortDirOptions = ['asc', 'desc'];

            return {
                confirm_accept: validateBool(parsedSettings.confirm_accept, defaultSettings.confirm_accept),
                confirm_reject: validateBool(parsedSettings.confirm_reject, defaultSettings.confirm_reject),
                replacement_filter: ['all', 'replacement', 'new'].includes(parsedSettings.replacement_filter) ? parsedSettings.replacement_filter : defaultSettings.replacement_filter,
                pending_per_page: validateNumber(parsedSettings.pending_per_page, defaultSettings.pending_per_page),
                pending_sort_by: pendingSortByOptions.includes(parsedSettings.pending_sort_by) ? parsedSettings.pending_sort_by : defaultSettings.pending_sort_by,
                pending_sort_dir: pendingSortDirOptions.includes(parsedSettings.pending_sort_dir) ? parsedSettings.pending_sort_dir : defaultSettings.pending_sort_dir,
                pending_rated_only: validateBool(parsedSettings.pending_rated_only, defaultSettings.pending_rated_only),
                pending_from_creator_only: validateBool(parsedSettings.pending_from_creator_only, defaultSettings.pending_from_creator_only),
            };
        } else {
            return SettingsManager.getDefaultSettings();
        }
    }

    public static saveSettings(settings: UserSettings): void {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
}
