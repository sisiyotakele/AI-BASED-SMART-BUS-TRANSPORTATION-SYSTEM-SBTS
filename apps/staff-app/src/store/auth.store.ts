import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
}

// Helper function to safely parse localStorage
const getStoredUser = (): User | null => {
    try {
        const stored = localStorage.getItem('user');
        if (!stored || stored === 'undefined' || stored === 'null') return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

const getStoredToken = (key: string): string | null => {
    const stored = localStorage.getItem(key);
    if (!stored || stored === 'undefined' || stored === 'null') return null;
    return stored;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: getStoredUser(),
    accessToken: getStoredToken('accessToken'),
    refreshToken: getStoredToken('refreshToken'),
    isAuthenticated: !!getStoredToken('accessToken'),

    setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    clearAuth: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        set((state) => {
            if (!state.user) return state;
            const updatedUser = { ...state.user, ...updates };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return { user: updatedUser };
        });
    },
}));
