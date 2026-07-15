/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  errors?: { field?: string; message: string }[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as AuthResponse;

  if (!response.ok) {
    const validationMessage = data.errors
      ?.map((error) => error.message)
      .join(" ");
    throw new Error(validationMessage || data.message || "Request failed");
  }

  return data as T;
}

function persistSession(user: User, token: string) {
  setStoredUser(user);
  localStorage.setItem("token", token);
}

function setStoredUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!savedToken) {
      clearStoredSession();
      setLoading(false);
      return;
    }

    if (savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        clearStoredSession();
      }
    }

    apiRequest<AuthResponse>("/auth/me", {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then((data) => {
        if (!data.user) {
          throw new Error("Unable to load current user.");
        }

        setUser(data.user);
        setToken(savedToken);
        setStoredUser(data.user);
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        clearStoredSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data.token || !data.user) {
      throw new Error("Login response did not include a user session.");
    }

    setUser(data.user);
    setToken(data.token);
    persistSession(data.user, data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearStoredSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
