export interface ThemeColors {
  bg: string;
  panel: string;
  fg: string;
  muted: string;
  border: string;
  hover: string;
  active: string;
  accent: string;
  jsonKey: string;
  jsonString: string;
  jsonNumber: string;
  jsonBoolean: string;
  jsonNull: string;
  jsonPunctuation: string;
  diffAdded: string;
  diffRemoved: string;
  diffChanged: string;
}

export interface Theme {
  id: string;
  name: string;
  category: "dark" | "light";
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: "catppuccin",
    name: "Catppuccin Macchiato",
    category: "dark",
    colors: {
      bg: "#24273a",
      panel: "#1e2030",
      fg: "#cad3f5",
      muted: "#8087a2",
      border: "#363a4f",
      hover: "#363a4f",
      active: "#494d64",
      accent: "#c6a0f6",
      jsonKey: "#8aadf4",
      jsonString: "#a6da95",
      jsonNumber: "#f5a97f",
      jsonBoolean: "#c6a0f6",
      jsonNull: "#ed8796",
      jsonPunctuation: "#939ab7",
      diffAdded: "#a6da95",
      diffRemoved: "#ed8796",
      diffChanged: "#eed49f",
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    category: "dark",
    colors: {
      bg: "#1a1b26",
      panel: "#16161e",
      fg: "#c0caf5",
      muted: "#565f89",
      border: "#292e42",
      hover: "#292e42",
      active: "#3b4261",
      accent: "#7aa2f7",
      jsonKey: "#7aa2f7",
      jsonString: "#9ece6a",
      jsonNumber: "#ff9e64",
      jsonBoolean: "#bb9af7",
      jsonNull: "#f7768e",
      jsonPunctuation: "#7dcfff",
      diffAdded: "#9ece6a",
      diffRemoved: "#f7768e",
      diffChanged: "#e0af68",
    },
  },
  {
    id: "andromeda",
    name: "Andromeda",
    category: "dark",
    colors: {
      bg: "#262a36",
      panel: "#1b1d27",
      fg: "#e5e5e5",
      muted: "#707a8a",
      border: "#323846",
      hover: "#323846",
      active: "#3e4659",
      accent: "#00e676",
      jsonKey: "#00e676",
      jsonString: "#ffe66d",
      jsonNumber: "#ff007f",
      jsonBoolean: "#c5a3ff",
      jsonNull: "#ff79c6",
      jsonPunctuation: "#00e5ff",
      diffAdded: "#00e676",
      diffRemoved: "#ff007f",
      diffChanged: "#ffe66d",
    },
  },
  {
    id: "one-dark",
    name: "One Dark Pro",
    category: "dark",
    colors: {
      bg: "#282c34",
      panel: "#21252b",
      fg: "#abb2bf",
      muted: "#5c6370",
      border: "#3e4451",
      hover: "#3e4451",
      active: "#4b5263",
      accent: "#61afef",
      jsonKey: "#e06c75",
      jsonString: "#98c379",
      jsonNumber: "#d19a66",
      jsonBoolean: "#56b6c2",
      jsonNull: "#c678dd",
      jsonPunctuation: "#abb2bf",
      diffAdded: "#98c379",
      diffRemoved: "#e06c75",
      diffChanged: "#e5c07b",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    category: "dark",
    colors: {
      bg: "#282a36",
      panel: "#21222c",
      fg: "#f8f8f2",
      muted: "#6272a4",
      border: "#44475a",
      hover: "#44475a",
      active: "#6272a4",
      accent: "#bd93f9",
      jsonKey: "#ff79c6",
      jsonString: "#f1fa8c",
      jsonNumber: "#bd93f9",
      jsonBoolean: "#ffb86c",
      jsonNull: "#ff5555",
      jsonPunctuation: "#8be9fd",
      diffAdded: "#50fa7b",
      diffRemoved: "#ff5555",
      diffChanged: "#ffb86c",
    },
  },
  {
    id: "nord",
    name: "Nord",
    category: "dark",
    colors: {
      bg: "#2e3440",
      panel: "#242933",
      fg: "#eceff4",
      muted: "#616e88",
      border: "#3b4252",
      hover: "#3b4252",
      active: "#434c5e",
      accent: "#88c0d0",
      jsonKey: "#88c0d0",
      jsonString: "#a3be8c",
      jsonNumber: "#d08770",
      jsonBoolean: "#b48ead",
      jsonNull: "#bf616a",
      jsonPunctuation: "#81a1c1",
      diffAdded: "#a3be8c",
      diffRemoved: "#bf616a",
      diffChanged: "#ebcb8b",
    },
  },
  {
    id: "monokai-pro",
    name: "Monokai Pro",
    category: "dark",
    colors: {
      bg: "#2d2a2e",
      panel: "#221f22",
      fg: "#fcfcfa",
      muted: "#727072",
      border: "#403e41",
      hover: "#403e41",
      active: "#4a474a",
      accent: "#ffd866",
      jsonKey: "#ff6188",
      jsonString: "#a9dc76",
      jsonNumber: "#ab9df2",
      jsonBoolean: "#fc9867",
      jsonNull: "#78dce8",
      jsonPunctuation: "#939293",
      diffAdded: "#a9dc76",
      diffRemoved: "#ff6188",
      diffChanged: "#ffd866",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    category: "dark",
    colors: {
      bg: "#002b36",
      panel: "#073642",
      fg: "#839496",
      muted: "#586e75",
      border: "#073642",
      hover: "#073642",
      active: "#094352",
      accent: "#268bd2",
      jsonKey: "#268bd2",
      jsonString: "#2aa198",
      jsonNumber: "#d33682",
      jsonBoolean: "#b58900",
      jsonNull: "#cb4b16",
      jsonPunctuation: "#657b83",
      diffAdded: "#2aa198",
      diffRemoved: "#dc322f",
      diffChanged: "#b58900",
    },
  },
  {
    id: "gruvbox",
    name: "Gruvbox Dark",
    category: "dark",
    colors: {
      bg: "#282828",
      panel: "#1d2021",
      fg: "#ebdbb2",
      muted: "#928374",
      border: "#3c3836",
      hover: "#3c3836",
      active: "#504945",
      accent: "#fe8019",
      jsonKey: "#83a598",
      jsonString: "#b8bb26",
      jsonNumber: "#d3869b",
      jsonBoolean: "#fe8019",
      jsonNull: "#fb4934",
      jsonPunctuation: "#a89984",
      diffAdded: "#b8bb26",
      diffRemoved: "#fb4934",
      diffChanged: "#fabd2f",
    },
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    category: "dark",
    colors: {
      bg: "#0d1117",
      panel: "#161b22",
      fg: "#c9d1d9",
      muted: "#8b949e",
      border: "#30363d",
      hover: "#21262d",
      active: "#30363d",
      accent: "#58a6ff",
      jsonKey: "#79c0ff",
      jsonString: "#a5d6ff",
      jsonNumber: "#7ee787",
      jsonBoolean: "#ff7b72",
      jsonNull: "#ffa657",
      jsonPunctuation: "#8b949e",
      diffAdded: "#3fb950",
      diffRemoved: "#f85149",
      diffChanged: "#d29922",
    },
  },
];

export const DEFAULT_THEME_ID = "catppuccin";
export const THEME_STORAGE_KEY = "json-viewer-theme";

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getSavedThemeId(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function saveThemeId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // ignore storage errors
  }
}

export function applyThemeVariables(theme: Theme, element: HTMLElement = document.documentElement): void {
  const { colors } = theme;
  element.style.setProperty("--theme-bg", colors.bg);
  element.style.setProperty("--theme-panel", colors.panel);
  element.style.setProperty("--theme-fg", colors.fg);
  element.style.setProperty("--theme-muted", colors.muted);
  element.style.setProperty("--theme-border", colors.border);
  element.style.setProperty("--theme-hover", colors.hover);
  element.style.setProperty("--theme-active", colors.active);
  element.style.setProperty("--theme-accent", colors.accent);
  element.style.setProperty("--theme-json-key", colors.jsonKey);
  element.style.setProperty("--theme-json-string", colors.jsonString);
  element.style.setProperty("--theme-json-number", colors.jsonNumber);
  element.style.setProperty("--theme-json-boolean", colors.jsonBoolean);
  element.style.setProperty("--theme-json-null", colors.jsonNull);
  element.style.setProperty("--theme-json-punctuation", colors.jsonPunctuation);
  element.style.setProperty("--theme-diff-added", colors.diffAdded);
  element.style.setProperty("--theme-diff-removed", colors.diffRemoved);
  element.style.setProperty("--theme-diff-changed", colors.diffChanged);
}
