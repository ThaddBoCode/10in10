import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeCtx = { theme: string; setTheme: (t: string) => void };
const ThemeContext = createContext<ThemeCtx>({ theme: "glass", setTheme: () => {} });
export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState("glass");

  useEffect(() => {
    const saved = localStorage.getItem("10in10-theme") || "glass";
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
    document.documentElement.setAttribute("data-font", "prometo");
  }, []);

  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("10in10-theme", t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
