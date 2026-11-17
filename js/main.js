// 啟動：載入主題、還原狀態、掛載三欄。
import registry from "../data/registry.js";
import builtinStyles from "../data/styles.js";
import { createStore } from "./store.js";
import { indexDomain } from "./engine/domain.js";
import { createActions } from "./state.js";
import { STORAGE_KEY, LEGACY_KEY, restore, snapshot, readStorage, writeStorage, parseHash } from "./persist.js";
import { createToast } from "./ui/toast.js";
import { mountSteps } from "./ui/steps.js";
import { mountCatalog } from "./ui/catalog.js";
import { mountRecipe } from "./ui/recipe.js";
import { createStyleEditor } from "./ui/style-editor.js";
import { mountThemeToggle } from "./ui/theme.js";
import { createDrawer } from "./ui/drawer.js";

const domain = (await registry.web()).default;

const saved = readStorage(STORAGE_KEY);
const initial = { ...restore(saved, domain, builtinStyles, saved ? null : readStorage(LEGACY_KEY)), rev: 0, query: "" };
const fromHash = parseHash(location.hash, domain);
if (fromHash) initial.stepId = fromHash;

const store = createStore(initial);
const toast = createToast(document.body);
const actions = createActions(store, domain, { toast, confirm: (message) => window.confirm(message), builtinStyles });
const styleEditor = createStyleEditor(document.body, actions);
const drawer = createDrawer(document.getElementById("recipe"), { copy: () => recipeView.copy() });

const stepIndex = (id) => domain.steps.findIndex((s) => s.id === id);
const setHue = (state) => (document.body.dataset.hue = String(stepIndex(state.stepId)));
setHue(initial);

mountSteps(document.getElementById("steps"), store, domain, actions);
const recipeView = mountRecipe(document.getElementById("recipe"), store, domain, actions, toast, {
  openModule: (id) => openModule(id),
  builtinStyles,
  onUpdate: (info) => drawer.update(info),
});
const searchInput = document.getElementById("search");
const setQuery = (query) => {
  if (searchInput.value !== query) searchInput.value = query;
  if (store.get().query !== query) store.set({ query });
};
searchInput.addEventListener("input", () => setQuery(searchInput.value));
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setQuery("");
    searchInput.blur();
  }
});

/** 離開搜尋、切到模組所在的步驟，並把那張卡片捲到畫面上。 */
function openModule(moduleId) {
  const entry = indexDomain(domain).modules.get(moduleId);
  if (!entry) return;
  drawer.close();
  const step = domain.steps.find((s) => s.categories?.includes(entry.category.id));
  setQuery("");
  if (step) actions.goStep(step.id);
  setTimeout(() => {
    const card = document.getElementById(`m-${moduleId}`);
    if (!card) return;
    card.scrollIntoView({ block: "center" });
    card.querySelector(".add")?.focus({ preventScroll: true });
    card.classList.add("is-flash");
    setTimeout(() => card.classList.remove("is-flash"), 1600);
  }, 0);
}

mountCatalog(document.getElementById("catalog"), store, domain, actions, {
  highlight: (id) => recipeView.highlight(id),
  editStyle: (style) => styleEditor.open(style),
  openModule,
});

mountThemeToggle(document.getElementById("theme-toggle"));

let saveTimer;
store.subscribe((state, prev) => {
  if (state.stepId !== prev.stepId) {
    setHue(state);
    const hash = `#${domain.id}/${state.stepId}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeStorage(STORAGE_KEY, snapshot(state, builtinStyles)), 300);
});

// 分享連結：?r=模組清單。套用後從網址移除，避免重新整理時再套用一次。
const params = new URLSearchParams(location.search);
if (params.has("r")) {
  actions.applyShare(params.get("r") ?? "");
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
}

window.addEventListener("popstate", () => {
  const stepId = parseHash(location.hash, domain);
  if (stepId) actions.goStep(stepId);
});

// 快速鍵：/ 搜尋、Esc 離開搜尋、[ 與 ] 切換上一步與下一步（輸入文字時不作用）
document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest("input, textarea, select, dialog, [contenteditable]")) return;
  if (event.key === "/") {
    event.preventDefault();
    searchInput.focus();
    return;
  }
  if (event.key === "Escape" && store.get().query) return setQuery("");
  const move = event.key === "[" ? -1 : event.key === "]" ? 1 : 0;
  if (!move) return;
  const next = domain.steps[stepIndex(store.get().stepId) + move];
  if (next) actions.goStep(next.id);
});
