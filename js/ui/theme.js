// 深淺色切換：預設跟隨系統，手動切換後記住選擇。
const KEY = "ag_theme";
const system = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;

const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : system.matches);

export function mountThemeToggle(button) {
  if (!button) return;
  const render = () => {
    const dark = isDark();
    button.setAttribute("aria-pressed", String(dark));
    button.title = dark ? "切換為淺色外觀" : "切換為深色外觀";
  };
  button.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    render();
  });
  system.addEventListener("change", render);
  render();
}
