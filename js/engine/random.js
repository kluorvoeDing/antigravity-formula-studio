// 靈感骰子：隨機產生一份符合選擇規則、沒有衝突的配方。純函式，亂數來源可注入以便測試。
import { indexDomain, defaultRecipe, picksInGroup } from "./domain.js";
import { toggle } from "./select.js";
import { check } from "./check.js";

/** Fisher–Yates 洗牌，回傳新陣列。 */
export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const between = (lo, hi, rng) => (hi <= lo ? lo : lo + Math.floor(rng() * (hi - lo + 1)));

/** 每組要選幾個：必選組照下限；有序組（頁面區塊）4 到 8 個；其他複選組最多 3 個。 */
function target(group, rng) {
  if (group.mode === "one") return group.min > 0 || rng() < 0.75 ? 1 : 0;
  const lo = Math.max(group.min ?? 0, group.ordered ? 4 : 0);
  const hi = Math.max(lo, Math.min(group.max, group.ordered ? 8 : 3));
  return between(lo, hi, rng);
}

function roll(domain, base, rng) {
  const ix = indexDomain(domain);
  let recipe = { ...defaultRecipe(domain), brief: base.brief, styleId: base.styleId, onUnclear: base.onUnclear };
  for (const category of domain.categories) {
    for (const group of category.groups) {
      const want = target(group, rng);
      const pool = shuffle(
        category.modules.filter((m) => ix.modules.get(m.id).group.id === group.id),
        rng,
      );
      for (const module of pool) {
        if (picksInGroup(ix, recipe, category.id, group.id).length >= want) break;
        if ((recipe.picks[category.id] ?? []).includes(module.id)) continue;
        const result = toggle(domain, recipe, module.id);
        if (!result.reason) recipe = result.recipe;
      }
    }
  }
  return recipe;
}

/**
 * 隨機配方：保留簡述、個人風格與「不明確時」設定，其餘重新挑選。
 * 擲出有待處理事項（缺必選、相依、面向矛盾、太長）的結果會重擲，最多 tries 次，
 * 全部失敗時回傳問題最少的一份。
 */
export function randomRecipe(domain, base, rng = Math.random, tries = 40) {
  let best = null;
  for (let i = 0; i < tries; i++) {
    const recipe = roll(domain, base, rng);
    const issues = check(domain, recipe).length;
    if (issues === 0) return recipe;
    if (!best || issues < best.issues) best = { recipe, issues };
  }
  return best.recipe;
}
