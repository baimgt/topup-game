"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setLoading(false);

      // Verify token & sync latest user profile from server
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const updatedUser: AuthUser = {
          id: data.data._id || data.data.id || parsed.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else if (res.status === 401) {
        // Token invalid or logged out on server
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch {
      // Keep local state on network errors
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleAuthChange = () => loadUser();
    window.addEventListener("auth_changed", handleAuthChange);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") loadUser();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    setUser(data.data.user);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("token", data.data.token);
    window.dispatchEvent(new Event("auth_changed"));
    return data.data;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    setUser(data.data.user);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("token", data.data.token);
    window.dispatchEvent(new Event("auth_changed"));
    return data.data;
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    setUser(data.data.user);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("token", data.data.token);
    window.dispatchEvent(new Event("auth_changed"));
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth_changed"));
    toast.success("Berhasil keluar");
    router.push("/");
    router.refresh();
  }, [router]);

  return { user, loading, login, register, loginWithGoogle, logout };
}
