"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import Cookies from "js-cookie";
import { authService } from "@/lib/services";
import type { User, LoginPayload, RegisterPayload } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch {
      setUser(null);
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginPayload) => {
    const res = await authService.login(data);
    Cookies.set("access_token", res.data.access_token, { expires: 1 });
    if (res.data.refresh_token) {
      Cookies.set("refresh_token", res.data.refresh_token, { expires: 7 });
    }
    await refreshUser();
  };

  const register = async (data: RegisterPayload) => {
    const res = await authService.register(data);
    Cookies.set("access_token", res.data.access_token, { expires: 1 });
    if (res.data.refresh_token) {
      Cookies.set("refresh_token", res.data.refresh_token, { expires: 7 });
    }
    await refreshUser();
  };

  const googleLogin = async (idToken: string) => {
    const res = await authService.googleLogin(idToken);
    Cookies.set("access_token", res.data.access_token, { expires: 1 });
    if (res.data.refresh_token) {
      Cookies.set("refresh_token", res.data.refresh_token, { expires: 7 });
    }
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
  };

  const hasRole = (...roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
