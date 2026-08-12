"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
  createElement,
} from "react";
import {
  THEMES,
  DEFAULT_THEME_ID,
  getSavedThemeId,
  getThemeById,
  saveThemeId,
  applyThemeVariables,
  type Theme,
} from "../lib/themes";

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const [themeId, setThemeIdState] = useState<string>(() => getSavedThemeId());

  useEffect(() => {
    applyThemeVariables(getThemeById(themeId));
  }, [themeId]);

  function setThemeId(id: string) {
    const newTheme = getThemeById(id);
    setThemeIdState(newTheme.id);
    saveThemeId(newTheme.id);
  }

  const theme = getThemeById(themeId);

  return createElement(
    ThemeContext.Provider,
    { value: { theme, themeId, setThemeId, themes: THEMES } },
    children
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const theme = getThemeById(DEFAULT_THEME_ID);
    return {
      theme,
      themeId: DEFAULT_THEME_ID,
      setThemeId: () => {},
      themes: THEMES,
    };
  }
  return ctx;
}
