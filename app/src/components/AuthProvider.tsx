import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User } from "firebase/auth";
import { onAuthChange, login as doLogin, register as doRegister, logout as doLogout } from "../lib/auth";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (name: string, pin: string) => Promise<void>;
  register: (name: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthChange((u) => { setUser(u); setLoading(false); }), []);

  const login = async (name: string, pin: string) => { await doLogin(name, pin); };
  const register = async (name: string, pin: string) => { await doRegister(name, pin); };
  const logout = async () => { await doLogout(); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
