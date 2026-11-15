import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import registry from "../data/registry.js";
import { BANNED } from "../data/schema.js";
import { validateDomain, validateSource } from "../scripts/validate.mjs";
import { defaultRecipe, emptyRecipe } from "../js/engine/domain.js";
import { applyPreset, toggle } from "../js/engine/select.js";
import { assemble } from "../js/engine/assemble.js";

// P3 完成、所有類別都有模組後，把這個旗標改成 false。
const ALLOW_EMPTY = false;
const UPDATE = process.env.UPDATE_GOLDEN === "1";

const domains = {};
for (const [id, load] of Object.entries(registry)) domains[id] = (await load()).default;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

for (const [id, domain] of Object.entries(domains)) {
  test(`[${id}] 資料通過檢查`, () => {
    const { errors } = validateDomain(domain, { allowEmpty: ALLOW_EMPTY });
    assert.deepEqual(errors, []);
  });

  for (const preset of domain.presets ?? []) {
    test(`[${id}] 配方 ${preset.id} 的提示詞與 golden 相符`, async () => {
      const { text } = assemble(domain, applyPreset(domain, defaultRecipe(domain), preset.id));
      const file = new URL(`./golden/${id}.${preset.id}.txt`, import.meta.url);
      if (UPDATE) await writeFile(file, text + "\n");
      assert.equal(text + "\n", await readFile(file, "utf8"));
    });
  }

  test(`[${id}] 隨機配方的輸出不含禁用字眼或破損內容`, () => {
    const all = domain.categories.flatMap((c) => c.modules.map((m) => m.id));
    const rand = mulberry32(20261116);
    const banned = Object.values(BANNED).flat();
    for (let i = 0; i < 200; i++) {
      let recipe = emptyRecipe(domain);
      const tries = 5 + Math.floor(rand() * 40);
      for (let j = 0; j < tries && all.length; j++) {
        recipe = toggle(domain, recipe, all[Math.floor(rand() * all.length)], { force: true }).recipe;
      }
      const { text } = assemble(domain, recipe);
      assert.doesNotMatch(text, /undefined|\[object Object\]|NaN/);
      assert.doesNotMatch(text, /##[^\n]*\n\n/, "不得有空的段落標題");
      for (const word of banned) {
        const hit = /^[A-Za-z_]+$/.test(word) ? new RegExp(`(^|[^A-Za-z])${word}([^A-Za-z]|$)`, "i").test(text) : text.includes(word);
        assert.equal(hit, false, `輸出含禁用字眼 ${word}`);
      }
    }
  });
}

test("原始碼沒有禁用的 DOM API 或 iCloud 衝突副本", async () => {
  assert.deepEqual(await validateSource(), []);
});
