import {useRouter} from "vue-router";

export interface User {
    id: number;
    account_id: number;
    username: string;
    role: 'user' | 'verified' | 'moderator' | 'admin' | 'owner';
    discord_id?: string | null;
}

const CLIENT_ID = "1398022313877704764";
const REDIRECT_URI = `${window.location.origin}/auth/discord`;
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;

export default class SessionManager {
    private static loading: boolean = false;

    public static isLoading(): boolean {
        return SessionManager.loading;
    }

    public static async validateSession(): Promise<void> {
        SessionManager.loading = true;
        try {
            const response = await fetch('/auth/session', {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                // console.log('Session validation response:', data);
                if (data.user) {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    SessionManager.logout();
                }
            } else {
                SessionManager.logout();
            }
        } catch (error) {
            console.error('Error validating session:', error);
        } finally {
            SessionManager.loading = false;
        }
    }

    public static getUser(): User | null {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    public static getAuthRole(): string | null {
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const authCookie = cookies.find(cookie => cookie.startsWith('auth_role='));
        return authCookie ? authCookie.split('=')[1] : null;
    }

    public static isAuthenticated(): boolean {
        return SessionManager.getAuthRole() !== null;
    }

    public static logout(): void {
        sessionStorage.removeItem('user');
        document.cookie = 'auth_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        useRouter().replace({path: '/'});
    }

    public static beginDiscordAuth(): void {
        window.location.href = DISCORD_AUTH_URL;
    }
}