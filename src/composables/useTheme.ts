import { ref, watch, onMounted, onUnmounted } from "vue";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "theme";

function resolveTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function themeColorFor(mode: ThemeMode) {
  return mode === "dark" ? "#1a1a1a" : "#e6e6e6";
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;

  const color = themeColorFor(mode);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

export const useTheme = () => {
  const isDark = ref(resolveTheme() === "dark");

  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        isDark.value = e.matches;
      }
    } catch {
      isDark.value = e.matches;
    }
  };

  onMounted(() => {
    isDark.value = resolveTheme() === "dark";
    systemPrefersDark.addEventListener("change", handleSystemThemeChange);
  });

  onUnmounted(() => {
    systemPrefersDark.removeEventListener("change", handleSystemThemeChange);
  });

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    try {
      localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  watch(
    isDark,
    (dark) => {
      applyTheme(dark ? "dark" : "light");
    },
    { immediate: true },
  );

  return {
    isDark,
    toggleTheme,
  };
};
