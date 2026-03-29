"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type User = {
  id: string;
  name: string;
  height?: number | null;
  activityLevel: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (name: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/") {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  const login = async (name: string, pin: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      router.push("/dashboard");
      return { ok: true };
    }
    return { ok: false, error: data.error };
  };

  const register = async (name: string, pin: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      router.push("/dashboard");
      return { ok: true };
    }
    return { ok: false, error: data.error };
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
