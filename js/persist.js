// 狀態的保存與還原。純函式部分（清理、遷移）不碰瀏覽器 API，可在 Node 測試。
import { sanitize } from "./engine/select.js";
import { defaultRecipe } from "./engine/domain.js";

export const STORAGE_KEY = "ag_formula_hub_v4";
export const LEGACY_KEY = "ag_formula_hub_state_v3";
export const STYLE_OVERRIDES = ["typography", "color", "shape"];
const LEGACY_DEFAULTS = new Set(["craft", "darktech", "editorial"]);
const HEX = /^#[0-9a-fA-F]{6}$/;
const COLOR_KEYS = ["bg", "surface", "fg", "muted", "accent", "pop"];

const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const list = (value, maxItems, maxLen) =>
  (Array.isArray(value) ? value : []).map((v) => str(v, maxLen)).filter(Boolean).slice(0, maxItems);

/** 把任何輸入整理成合法的個人風格；不合法則回傳 null。 */
export function sanitizeStyle(input) {
  if (!input || typeof input !== "object") return null;
  const id = str(input.id, 60).replace(/[^\w-]/g, "");
  const name = str(input.name, 40);
  if (!id || !name) return null;
  const fonts = input.fonts && typeof input.fonts === "object" ? input.fonts : {};
  const colorsIn = input.colors && typeof input.colors === "object" ? input.colors : {};
  const colors = {};
  for (const key of COLOR_KEYS) if (HEX.test(colorsIn[key])) colors[key] = colorsIn[key].toUpperCase();
  return {
    id,
    name,
    fonts: { display: str(fonts.display, 60), body: str(fonts.body, 60), mono: str(fonts.mono, 60) },
    colors,
    radius: str(input.radius, 120),
    spacing: str(input.spacing, 120),
    signature: list(input.signature, 6, 120),
    avoid: list(input.avoid, 6, 120),
    overrides: STYLE_OVERRIDES.filter((key) => Array.isArray(input.overrides) && input.overrides.includes(key)),
  };
}

/** 舊版（v3）的 Style DNA → 新的個人風格。內建的三組不搬。 */
export function migrateLegacy(legacy) {
  const profiles = legacy && typeof legacy === "object" && legacy.dnaProfiles && typeof legacy.dnaProfiles === "object" ? legacy.dnaProfiles : {};
  const out = [];
  for (const [key, dna] of Object.entries(profiles)) {
    if (LEGACY_DEFAULTS.has(key) || !dna || typeof dna !== "object") continue;
    const style = sanitizeStyle({
      id: `v3-${key}`,
      name: dna.name || key,
      fonts: {},
      colors: { bg: dna.bg, fg: dna.fg, accent: dna.accent, pop: dna.pop },
      radius: dna.radiusSpacing,
      signature: [dna.fontVibe && `字體氣質：${dna.fontVibe}`, ...String(dna.signatureTouch ?? "").split(/[、；;]/)],
      overrides: ["color"],
    });
    if (style) out.push(style);
  }
  return out;
}

/**
 * 由儲存的 JSON 還原狀態。任何欄位不合法都退回預設值。
 * @param {unknown} saved  解析後的 v4 資料
 * @param {object} domain  目前主題
 * @param {object[]} builtinStyles
 * @param {unknown} [legacy] 解析後的 v3 資料
 */
export function restore(saved, domain, builtinStyles, legacy = null) {
  const src = saved && typeof saved === "object" ? saved : {};
  const savedRecipe = src.recipes && typeof src.recipes === "object" ? src.recipes[domain.id] : null;
  const recipe = savedRecipe ? sanitize(domain, savedRecipe).recipe : defaultRecipe(domain);

  const seen = new Set(builtinStyles.map((s) => s.id));
  const custom = [];
  const incoming = [...(Array.isArray(src.styles) ? src.styles : []), ...(saved ? [] : migrateLegacy(legacy))];
  for (const raw of incoming.slice(0, 30)) {
    const style = sanitizeStyle(raw);
    if (!style || seen.has(style.id)) continue;
    seen.add(style.id);
    custom.push(style);
  }
  const styles = [...builtinStyles, ...custom];
  if (recipe.styleId && !styles.some((s) => s.id === recipe.styleId)) recipe.styleId = null;

  const stepId = domain.steps.some((s) => s.id === src.stepId) ? src.stepId : domain.steps[0].id;
  return { domainId: domain.id, stepId, recipe, styles, manualText: null };
}

/** 要寫進 localStorage 的內容：只存使用者自訂的風格。 */
export function snapshot(state, builtinStyles) {
  const builtin = new Set(builtinStyles.map((s) => s.id));
  return {
    v: 4,
    domainId: state.domainId,
    stepId: state.stepId,
    recipes: { [state.domainId]: state.recipe },
    styles: state.styles.filter((s) => !builtin.has(s.id)),
  };
}

export function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 網址片段：#web/sections */
export function parseHash(hash, domain) {
  const [domainId, stepId] = String(hash).replace(/^#/, "").split("/");
  if (domainId !== domain.id) return null;
  return domain.steps.some((s) => s.id === stepId) ? stepId : null;
}
