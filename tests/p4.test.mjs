import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDomain } from "./fixture.mjs";
import { defaultRecipe, emptyRecipe } from "../js/engine/domain.js";
import { toggle } from "../js/engine/select.js";
import { check } from "../js/engine/check.js";
import { shuffle, randomRecipe } from "../js/engine/random.js";
import { encodeShare, decodeShare, exportData, importData, EXPORT_KIND } from "../js/persist.js";
import registry from "../data/registry.js";

const domain = makeDomain();
const builtin = [{ id: "builtin-a", name: "內建", fonts: {}, colors: {}, radius: "", spacing: "", signature: [], avoid: [], overrides: [] }];
const pick = (recipe, ...ids) => ids.reduce((r, id) => toggle(domain, r, id).recipe, recipe);

/** 固定種子的亂數（mulberry32），讓測試可重現。 */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("shuffle 不增不減元素，也不改動原陣列", () => {
  const list = [1, 2, 3, 4, 5, 6];
  const out = shuffle(list, seeded(1));
  assert.deepEqual([...out].sort(), list);
  assert.deepEqual(list, [1, 2, 3, 4, 5, 6]);
});

test("靈感骰子：保留簡述與風格，產出沒有待處理事項的配方", () => {
  const base = { ...emptyRecipe(domain), brief: { ...emptyRecipe(domain).brief, name: "我的站" }, styleId: "s1", onUnclear: "ask" };
  for (let seed = 1; seed <= 30; seed++) {
    const recipe = randomRecipe(domain, base, seeded(seed));
    assert.equal(recipe.brief.name, "我的站");
    assert.equal(recipe.styleId, "s1");
    assert.equal(recipe.onUnclear, "ask");
    assert.deepEqual(check(domain, recipe), [], `種子 ${seed}`);
  }
});

for (const [id, load] of Object.entries(registry)) {
  test(`靈感骰子：[${id}] 擲 200 次都沒有待處理事項`, async () => {
    const real = (await load()).default;
    const rng = seeded(42);
    for (let i = 0; i < 200; i++) {
      const recipe = randomRecipe(real, defaultRecipe(real), rng);
      assert.deepEqual(check(real, recipe).map((x) => x.msg), [], `第 ${i} 次`);
    }
  });
}

test("分享連結：編碼後解碼得到相同的選取與順序", () => {
  const recipe = pick(emptyRecipe(domain), "t.kind.b", "t.part.p3", "t.part.p1");
  const text = encodeShare(domain, recipe);
  assert.equal(text, "kind.b,part.p3,part.p1");
  assert.deepEqual(decodeShare(domain, text).picks, { kind: ["t.kind.b"], part: ["t.part.p3", "t.part.p1"] });
});

test("分享連結：未知 id、原型鍵名與過長的輸入都安全處理", () => {
  const out = decodeShare(domain, "kind.a,__proto__.x,constructor.y,nope.z,kind.b");
  assert.deepEqual(out.picks, { kind: ["t.kind.a"] });
  assert.ok(out.dropped.length >= 3);
  assert.equal(decodeShare(domain, "x".repeat(5000)), null);
  assert.equal(decodeShare(domain, 42), null);
  assert.equal(decodeShare(domain, ""), null);
});

test("匯出後匯入：配方與自訂風格都回來，內建風格不重複", () => {
  const state = {
    domainId: "t",
    stepId: "parts",
    recipe: { ...pick(emptyRecipe(domain), "t.kind.a"), styleId: "mine" },
    styles: [...builtin, { id: "mine", name: "我的", fonts: {}, colors: { bg: "#FFFFFF" }, radius: "", spacing: "", signature: [], avoid: [], overrides: [] }],
  };
  const file = JSON.parse(JSON.stringify(exportData(state, builtin)));
  assert.equal(file.kind, EXPORT_KIND);
  const out = importData(file, domain, builtin, builtin);
  assert.deepEqual(out.recipe.picks, { kind: ["t.kind.a"] });
  assert.equal(out.recipe.styleId, "mine");
  assert.deepEqual(out.styles.map((s) => s.id), ["builtin-a", "mine"]);
  assert.equal(out.dropped, 0);
});

test("匯入：種類不對或沒有此主題的配方時拒絕；惡意內容被清掉", () => {
  assert.equal(importData({ recipes: { t: {} } }, domain, builtin, builtin), null);
  assert.equal(importData({ kind: EXPORT_KIND, recipes: {} }, domain, builtin, builtin), null);
  assert.equal(importData("字串", domain, builtin, builtin), null);
  const out = importData(
    { kind: EXPORT_KIND, recipes: { t: { picks: { kind: ["<img onerror=1>", "t.kind.b"] } } }, styles: [{ id: "builtin-a", name: "冒名" }, { id: "x<y", name: "新的" }] },
    domain,
    builtin,
    builtin,
  );
  assert.deepEqual(out.recipe.picks, { kind: ["t.kind.b"] });
  assert.equal(out.dropped, 1);
  assert.deepEqual(out.styles.map((s) => s.name), ["內建", "新的"]);
});

test("切換主題：存檔保留其他主題的配方，步驟只在同主題時還原", async () => {
  const { restore, snapshot } = await import("../js/persist.js");
  const other = { ...domain, id: "u", steps: [{ id: "begin", zh: "開始", kind: "start" }, ...domain.steps.slice(1)] };
  const first = restore(null, domain, builtin);
  first.recipe = pick(first.recipe, "t.kind.b");
  first.stepId = "parts";
  const saved1 = JSON.parse(JSON.stringify(snapshot(first, builtin)));
  // 切到另一個主題：步驟回到起點，原主題配方保留在 otherRecipes
  const second = restore(saved1, other, builtin);
  assert.equal(second.stepId, "begin");
  assert.deepEqual(second.otherRecipes.t.picks.kind, ["t.kind.b"]);
  const saved2 = JSON.parse(JSON.stringify(snapshot(second, builtin)));
  // 切回來：原主題配方完整
  const third = restore(saved2, domain, builtin);
  assert.deepEqual(third.recipe.picks.kind, ["t.kind.b"]);
  assert.ok(saved2.recipes.u);
});
