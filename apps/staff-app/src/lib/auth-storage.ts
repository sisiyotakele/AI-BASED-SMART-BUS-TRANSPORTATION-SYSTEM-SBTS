import { User } from '@/types';

export type PortalScope = 'admin' | 'driver';

const PORTAL_HINT_KEY = 'sbts:portal-hint';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const getStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.localStorage;
};

const getSessionStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.sessionStorage;
};

const getNamespacedKey = (scope: PortalScope, key: string) => `sbts:${scope}:${key}`;

const getPortalFromPath = (pathname: string): PortalScope | null => {
    const p = pathname.toLowerCase();
    if (p.startsWith('/driver') || p.includes('driver.html')) return 'driver';
    if (p.startsWith('/dashboard')) return 'admin';
    return null;
};

export const getActivePortal = (): PortalScope => {
    if (typeof window === 'undefined') return 'admin';

    const fromPath = getPortalFromPath(window.location.pathname);
    if (fromPath) return fromPath;

    const hint = getSessionStorage()?.getItem(PORTAL_HINT_KEY);
    if (hint === 'admin' || hint === 'driver') return hint;

    return 'admin';
};

export const setPortalHint = (scope: PortalScope) => {
    getSessionStorage()?.setItem(PORTAL_HINT_KEY, scope);
};

const getRawValue = (scope: PortalScope, key: string): string | null => {
    const storage = getStorage();
    if (!storage) return null;
    return storage.getItem(getNamespacedKey(scope, key));
};

const setRawValue = (scope: PortalScope, key: string, value: string) => {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(getNamespacedKey(scope, key), value);
};

const removeRawValue = (scope: PortalScope, key: string) => {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(getNamespacedKey(scope, key));
};

export const authStorage = {
    getAccessToken(scope: PortalScope = getActivePortal()): string | null {
        const token = getRawValue(scope, ACCESS_TOKEN_KEY);
        if (!token || token === 'undefined' || token === 'null') return null;
        return token;
    },

    setAccessToken(token: string, scope: PortalScope = getActivePortal()) {
        setRawValue(scope, ACCESS_TOKEN_KEY, token);
    },

    removeAccessToken(scope: PortalScope = getActivePortal()) {
        removeRawValue(scope, ACCESS_TOKEN_KEY);
    },

    getRefreshToken(scope: PortalScope = getActivePortal()): string | null {
        const token = getRawValue(scope, REFRESH_TOKEN_KEY);
        if (!token || token === 'undefined' || token === 'null') return null;
        return token;
    },

    setRefreshToken(token: string, scope: PortalScope = getActivePortal()) {
        setRawValue(scope, REFRESH_TOKEN_KEY, token);
    },

    removeRefreshToken(scope: PortalScope = getActivePortal()) {
        removeRawValue(scope, REFRESH_TOKEN_KEY);
    },

    getUser(scope: PortalScope = getActivePortal()): User | null {
        const raw = getRawValue(scope, USER_KEY);
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    },

    setUser(user: User, scope: PortalScope = getActivePortal()) {
        setRawValue(scope, USER_KEY, JSON.stringify(user));
    },

    removeUser(scope: PortalScope = getActivePortal()) {
        removeRawValue(scope, USER_KEY);
    },

    clearScope(scope: PortalScope = getActivePortal()) {
        this.removeUser(scope);
        this.removeAccessToken(scope);
        this.removeRefreshToken(scope);
    },

    getCurrentUserId(scope: PortalScope = getActivePortal()): string | null {
        const user = this.getUser(scope);
        return user?.id || null;
    },
};
