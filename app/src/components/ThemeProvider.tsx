"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: string;
  fontSet: string;
  setTheme: (theme: string) => void;
  setFontSet: (fontSet: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "glass",
  fontSet: "prometo",
  setTheme: () => {},
  setFontSet: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("glass");
  const [fontSet, setFontSetState] = useState("prometo");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("10in10-theme") || "glass";
    const savedFont = localStorage.getItem("10in10-font") || "prometo";
    setThemeState(savedTheme);
    setFontSetState(savedFont);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("10in10-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-font", fontSet);
    localStorage.setItem("10in10-font", fontSet);
  }, [fontSet, mounted]);

  const setTheme = (t: string) => setThemeState(t);
  const setFontSet = (f: string) => setFontSetState(f);

  return (
    <ThemeContext.Provider value={{ theme, fontSet, setTheme, setFontSet }}>
      {children}
    </ThemeContext.Provider>
  );
}
