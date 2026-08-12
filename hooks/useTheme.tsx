"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type ReactElement,
  createElement,
} from "react";
import {
  THEMES,
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  getSavedThemeId,
  getThemeById,
  saveThemeId,
  applyThemeVariables,
  type Theme,
} from "../lib/themes";
import { applyFavicon } from "../lib/favicon";
import { DialogProvider } from "../components/DialogProvider";

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The server has no localStorage, so it always renders DEFAULT_THEME_ID.
// useLayoutEffect (not useEffect) on the server just warns and does
// nothing useful, so fall back to useEffect there — the client is the only
// place this actually needs to run before paint.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  // Must start at the same DEFAULT_THEME_ID the server rendered — reading
  // localStorage here via a lazy useState initializer makes the client's
  // first render disagree with the server's HTML. React calls that a
  // hydration mismatch, logs "won't be patched up", and leaves whichever
  // DOM node hydrated first stuck with the server's default-theme colors
  // until something unrelated happens to re-render it — which is exactly
  // the "saved theme reverts to default after reload" bug this fixes.
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);

  // Runs synchronously after the DOM commits but before the browser paints,
  // so switching away from the default (when a different theme was saved)
  // never flashes on screen.
  useIsomorphicLayoutEffect(() => {
    const saved = getSavedThemeId();
    if (saved !== DEFAULT_THEME_ID) setThemeIdState(saved);
  }, []);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (!e.key || e.key === THEME_STORAGE_KEY || e.key === "devure-json:settings") {
        const saved = getSavedThemeId();
        setThemeIdState(saved);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const theme = getThemeById(themeId);
    applyThemeVariables(theme);
    applyFavicon(theme);
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
    createElement(DialogProvider, null, children)
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
