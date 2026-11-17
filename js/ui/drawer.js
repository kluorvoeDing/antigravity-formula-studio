// 窄螢幕：右欄改成底部抽屜，底部固定一條配方列（展開與複製）。寬螢幕時這些都不作用。
import { h } from "./dom.js";

const NARROW = window.matchMedia("(max-width: 820px)");

export function createDrawer(panel, { copy }) {
  let open = false;
  let count = 0;

  const toggle = h("button", {
    type: "button",
    class: "bar-toggle",
    "aria-controls": panel.id,
    "aria-expanded": "false",
    on: { click: () => set(!open) },
  });
  const bar = h(
    "div",
    { class: "recipe-bar" },
    toggle,
    h("button", { type: "button", class: "solid", on: { click: () => copy() } }, "複製提示詞"),
  );
  document.body.append(bar);

  function sync() {
    const narrow = NARROW.matches;
    const shown = narrow && open;
    panel.classList.toggle("is-open", shown);
    if (narrow && !open) panel.setAttribute("inert", "");
    else panel.removeAttribute("inert");
    toggle.setAttribute("aria-expanded", String(shown));
    toggle.textContent = `${shown ? "收合" : "查看"}配方與提示詞（${count} 個模組）`;
  }

  function set(value) {
    open = value;
    sync();
    if (open && NARROW.matches) {
      panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !open || !NARROW.matches) return;
    if (event.target.closest("dialog")) return;
    set(false);
    toggle.focus();
  });
  NARROW.addEventListener("change", sync);
  sync();

  return {
    update(info) {
      count = info.count;
      sync();
    },
    close() {
      if (open) set(false);
    },
  };
}
