// 選取規則：加入／移除、排序、套用配方、清理外來資料。全部是純函式。
import { BRIEF_FIELDS, BRIEF_MAX } from "../../data/schema.js";
import { indexDomain, emptyRecipe, allPicked, picksInGroup } from "./domain.js";

function withPicks(recipe, categoryId, ids) {
  const picks = { ...recipe.picks };
  if (ids.length) picks[categoryId] = ids;
  else delete picks[categoryId];
  return { ...recipe, picks };
}

function removeIds(recipe, ids) {
  const drop = new Set(ids);
  const picks = {};
  for (const [categoryId, list] of Object.entries(recipe.picks)) {
    const kept = list.filter((id) => !drop.has(id));
    if (kept.length) picks[categoryId] = kept;
  }
  return { ...recipe, picks };
}

/**
 * 加入或移除一個模組。
 * 回傳 { recipe, replaced, blocked, reason }：
 * - replaced：因單選規則或強制取代而被移除的 id
 * - blocked：與之衝突、需要使用者確認才會取代的 id（此時 recipe 不變，reason 為 "conflict"）
 * - reason："max" 表示該組已達上限；"unknown" 表示沒有這個模組
 */
export function toggle(domain, recipe, moduleId, { force = false } = {}) {
  const ix = indexDomain(domain);
  const entry = ix.modules.get(moduleId);
  if (!entry) return { recipe, replaced: [], blocked: [], reason: "unknown" };

  const { category, group } = entry;
  const current = recipe.picks[category.id] ?? [];

  if (current.includes(moduleId)) {
    return { recipe: withPicks(recipe, category.id, current.filter((id) => id !== moduleId)), replaced: [], blocked: [] };
  }

  const picked = new Set(allPicked(recipe));
  const clashing = [...(ix.conflicts.get(moduleId) ?? [])].filter((id) => picked.has(id));
  if (clashing.length && !force) {
    return { recipe, replaced: [], blocked: clashing, reason: "conflict" };
  }

  let next = clashing.length ? removeIds(recipe, clashing) : recipe;
  const replaced = [...clashing];
  const inGroup = picksInGroup(ix, next, category.id, group.id);

  if (group.mode === "one") {
    replaced.push(...inGroup);
    next = removeIds(next, inGroup);
  } else if (inGroup.length >= group.max) {
    return { recipe, replaced: [], blocked: [], reason: "max" };
  }

  next = withPicks(next, category.id, [...(next.picks[category.id] ?? []), moduleId]);
  return { recipe: next, replaced, blocked: [] };
}

/** 把某類別的第 from 個已選項移到第 to 個位置。 */
export function reorder(recipe, categoryId, from, to) {
  const list = [...(recipe.picks[categoryId] ?? [])];
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return recipe;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  return withPicks(recipe, categoryId, list);
}

/** 套用現成配方：取代選取與個人風格；簡述只填入使用者尚未填寫的欄位。 */
export function applyPreset(domain, recipe, presetId) {
  const preset = (domain.presets ?? []).find((p) => p.id === presetId);
  if (!preset) return recipe;
  const brief = { ...recipe.brief };
  for (const [field, value] of Object.entries(preset.brief ?? {})) {
    if (!brief[field]) brief[field] = value;
  }
  const draft = { ...recipe, brief, picks: preset.picks, styleId: preset.styleId ?? recipe.styleId };
  return sanitize(domain, draft).recipe;
}

function cleanString(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/**
 * 把任何外來 JSON（匯入檔、分享連結、舊版儲存）整理成合法配方。
 * 未知或放錯類別的 id、超過上限的選取都會被丟棄並列在 dropped。
 */
export function sanitize(domain, input) {
  const ix = indexDomain(domain);
  const recipe = emptyRecipe(domain);
  const dropped = [];
  const src = input && typeof input === "object" ? input : {};

  const brief = src.brief && typeof src.brief === "object" ? src.brief : {};
  for (const field of BRIEF_FIELDS) {
    const value = cleanString(brief[field], BRIEF_MAX[field]);
    if (value) recipe.brief[field] = value;
  }
  recipe.styleId = typeof src.styleId === "string" ? src.styleId.slice(0, 80) : null;
  recipe.onUnclear = src.onUnclear === "ask" ? "ask" : "assume";

  const picks = src.picks && typeof src.picks === "object" && !Array.isArray(src.picks) ? src.picks : {};
  const seen = new Set();
  for (const category of domain.categories) {
    const raw = Array.isArray(picks[category.id]) ? picks[category.id] : [];
    const kept = [];
    const perGroup = new Map();
    for (const id of raw) {
      const entry = typeof id === "string" ? ix.modules.get(id) : null;
      if (!entry || entry.category.id !== category.id || seen.has(id)) {
        dropped.push(String(id).slice(0, 80));
        continue;
      }
      const count = perGroup.get(entry.group.id) ?? 0;
      const limit = entry.group.mode === "one" ? 1 : entry.group.max;
      if (count >= limit) {
        dropped.push(id);
        continue;
      }
      perGroup.set(entry.group.id, count + 1);
      seen.add(id);
      kept.push(id);
    }
    if (kept.length) recipe.picks[category.id] = kept;
  }
  for (const key of Object.keys(picks)) {
    if (!ix.categories.has(key)) dropped.push(String(key).slice(0, 80));
  }
  return { recipe, dropped };
}
