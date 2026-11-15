// 主題索引與配方的基本操作（純函式，不碰 DOM）。
import { DEFAULT_LANG } from "../../data/schema.js";

const cache = new WeakMap();

/** 建立主題的查詢索引：模組 → 類別與分組、雙向衝突表。 */
export function indexDomain(domain) {
  let ix = cache.get(domain);
  if (ix) return ix;

  const modules = new Map();
  const categories = new Map();
  const conflicts = new Map();
  const link = (a, b) => {
    if (!conflicts.has(a)) conflicts.set(a, new Set());
    conflicts.get(a).add(b);
  };

  for (const category of domain.categories) {
    categories.set(category.id, category);
    const groups = new Map(category.groups.map((g) => [g.id, g]));
    category.modules.forEach((module, order) => {
      const group = groups.get(module.group ?? category.groups[0].id) ?? category.groups[0];
      modules.set(module.id, { module, category, group, order });
    });
  }
  for (const { module } of modules.values()) {
    for (const other of module.conflicts ?? []) {
      link(module.id, other);
      link(other, module.id);
    }
  }

  ix = { modules, categories, conflicts };
  cache.set(domain, ix);
  return ix;
}

export function emptyBrief() {
  return { name: "", oneLiner: "", audience: "", goal: "", content: "", extra: "", lang: DEFAULT_LANG };
}

export function emptyRecipe(domain) {
  return { v: 1, domain: domain.id, brief: emptyBrief(), picks: {}, styleId: null, onUnclear: "assume" };
}

/** 新配方：套用各組的預選模組。 */
export function defaultRecipe(domain) {
  const recipe = emptyRecipe(domain);
  for (const category of domain.categories) {
    const ids = category.groups.flatMap((g) => g.defaults ?? []);
    if (ids.length) recipe.picks[category.id] = ids;
  }
  return recipe;
}

export function allPicked(recipe) {
  return Object.values(recipe.picks).flat();
}

export function isPicked(recipe, moduleId) {
  return allPicked(recipe).includes(moduleId);
}

/** 某類別中屬於某分組的已選 id（保持選取順序）。 */
export function picksInGroup(ix, recipe, categoryId, groupId) {
  return (recipe.picks[categoryId] ?? []).filter((id) => ix.modules.get(id)?.group.id === groupId);
}

/**
 * 某類別的已選模組，依輸出順序排列：
 * 有序分組依使用者選取順序，其餘依資料檔順序；分組之間依類別定義的順序。
 */
export function orderedPicks(ix, recipe, categoryId) {
  const category = ix.categories.get(categoryId);
  if (!category) return [];
  const out = [];
  for (const group of category.groups) {
    const entries = picksInGroup(ix, recipe, categoryId, group.id).map((id) => ix.modules.get(id));
    if (!group.ordered) entries.sort((a, b) => a.order - b.order);
    out.push(...entries);
  }
  return out;
}
