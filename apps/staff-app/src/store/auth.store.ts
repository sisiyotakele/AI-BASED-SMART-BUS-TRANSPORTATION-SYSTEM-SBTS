import { create } from 'zustand';
import { User } from '@/types';
import { authStorage, getActivePortal, PortalScope } from '@/lib/auth-storage';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string, scope?: PortalScope) => void;
    clearAuth: (scope?: PortalScope) => void;
    updateUser: (user: Partial<User>) => void;
}

const initialScope = getActivePortal();

export const useAuthStore = create<AuthState>((set) => ({
    user: authStorage.getUser(initialScope),
    accessToken: authStorage.getAccessToken(initialScope),
    refreshToken: authStorage.getRefreshToken(initialScope),
    isAuthenticated: !!authStorage.getAccessToken(initialScope),

    setAuth: (user, accessToken, refreshToken, scope = getActivePortal()) => {
        authStorage.setUser(user, scope);
        authStorage.setAccessToken(accessToken, scope);
        authStorage.setRefreshToken(refreshToken, scope);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    clearAuth: (scope = getActivePortal()) => {
        authStorage.clearScope(scope);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        set((state) => {
            if (!state.user) return state;
            const updatedUser = { ...state.user, ...updates };
            authStorage.setUser(updatedUser, getActivePortal());
            return { user: updatedUser };
        });
    },
}));
