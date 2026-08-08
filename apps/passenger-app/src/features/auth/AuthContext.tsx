import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (accessToken: string, refreshToken: string, userData?: UserProfile) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem("isGuest") === "true");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Step 2: Fetch current user profile using GET /auth/me from Swagger spec
  const fetchUserProfile = useCallback(async () => {
    const activeToken = localStorage.getItem("token");
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.me();
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.warn("Failed to fetch user profile via GET /auth/me:", error);
      // If token is bad/expired and couldn't be refreshed, clear user
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch profile whenever token changes or on initial mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUserProfile]);

  // Step 1: Standardized login helper to store token & refreshToken
  const login = (accessToken: string, refreshToken: string, userData?: UserProfile) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.removeItem("isGuest");
    setToken(accessToken);
    setIsGuest(false);
    if (userData) {
      setUser(userData);
    } else {
      fetchUserProfile();
    }
  };

  // Step 3: Server-side logout via POST /auth/logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Server logout request error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isGuest");
      setToken(null);
      setUser(null);
      setIsGuest(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isGuest,
        isLoading,
        user,
        login,
        logout,
        refetchUser: fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};