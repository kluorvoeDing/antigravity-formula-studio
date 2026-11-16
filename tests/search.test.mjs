import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, search } from "../js/search.js";

const mod = (id, zh, en, extra = {}) => ({ id, zh, en, what: "說明文字。", when: ["一"], avoid: ["二"], prompt: "做。", tags: ["入門"], ...extra });
const domain = {
  id: "t",
  steps: [
    { id: "start", zh: "起點", kind: "start" },
    { id: "a", zh: "甲", categories: ["one"] },
    { id: "b", zh: "乙", categories: ["two"] },
  ],
  categories: [
    { id: "one", zh: "一", modules: [mod("t.one.hero", "左右分割主視覺", "Split Hero", { aka: ["雙欄首屏"] }), mod("t.one.nav", "固定導覽列", "Sticky Navbar", { what: "頁面最上方的橫列，主視覺上方。" })] },
    { id: "two", zh: "二", modules: [mod("t.two.sticky", "釘選捲動", "Sticky Scroll", { tags: ["捲動"] })] },
    { id: "orphan", zh: "沒有步驟", modules: [mod("t.orphan.x", "孤兒", "Orphan")] },
  ],
};
const index = buildIndex(domain);
const ids = (q) => search(index, q).map((e) => e.module.id);

test("索引只收錄出現在步驟中的類別", () => {
  assert.equal(index.length, 3);
});

test("空白查詢回傳空陣列", () => {
  assert.deepEqual(ids(""), []);
  assert.deepEqual(ids("   "), []);
});

test("中英文名稱、別名、標籤、說明都能命中，且不分大小寫", () => {
  assert.deepEqual(ids("HERO"), ["t.one.hero"]);
  assert.deepEqual(ids("雙欄"), ["t.one.hero"]);
  assert.deepEqual(ids("捲動"), ["t.two.sticky"]);
  assert.deepEqual(ids("橫列"), ["t.one.nav"]);
});

test("名稱命中排在說明命中之前；名稱開頭優先", () => {
  assert.deepEqual(ids("主視覺"), ["t.one.hero", "t.one.nav"]);
  assert.deepEqual(ids("sticky"), ["t.one.nav", "t.two.sticky"]);
  assert.deepEqual(ids("釘選"), ["t.two.sticky"]);
});

test("多個詞必須全部命中", () => {
  assert.deepEqual(ids("sticky 捲動"), ["t.two.sticky"]);
  assert.deepEqual(ids("sticky 不存在"), []);
});

test("limit 限制回傳數量", () => {
  assert.equal(search(index, "s", 1).length, 1);
});
