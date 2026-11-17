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

test("靈感骰子：真實的網頁主題 200 次都沒有待處理事項", async () => {
  const web = (await registry.web()).default;
  const rng = seeded(42);
  for (let i = 0; i < 200; i++) {
    const recipe = randomRecipe(web, defaultRecipe(web), rng);
    assert.deepEqual(check(web, recipe).map((x) => x.msg), [], `第 ${i} 次`);
  }
});

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
