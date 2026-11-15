import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDomain, style } from "./fixture.mjs";
import { defaultRecipe, emptyRecipe } from "../js/engine/domain.js";
import { toggle, reorder, applyPreset, sanitize } from "../js/engine/select.js";
import { check, stepStatus, capabilities } from "../js/engine/check.js";
import { assemble } from "../js/engine/assemble.js";

const domain = makeDomain();
const pick = (recipe, ...ids) => ids.reduce((r, id) => toggle(domain, r, id).recipe, recipe);

test("新配方套用各組的預選", () => {
  assert.deepEqual(defaultRecipe(domain).picks, { color: ["t.color.x1"] });
});

test("單選組：選第二個會取代第一個", () => {
  const first = toggle(domain, emptyRecipe(domain), "t.kind.a");
  const second = toggle(domain, first.recipe, "t.kind.b");
  assert.deepEqual(second.recipe.picks.kind, ["t.kind.b"]);
  assert.deepEqual(second.replaced, ["t.kind.a"]);
});

test("再點一次會取消選取，空類別不留鍵", () => {
  const r = pick(emptyRecipe(domain), "t.kind.a", "t.kind.a");
  assert.deepEqual(r.picks, {});
});

test("複選組達上限時拒絕加入", () => {
  const r = pick(emptyRecipe(domain), "t.part.p1", "t.part.p2", "t.part.p3");
  const res = toggle(domain, r, "t.part.p4");
  assert.equal(res.reason, "max");
  assert.equal(res.recipe, r);
});

test("同類別不同分組互不影響", () => {
  const r = pick(emptyRecipe(domain), "t.color.duo", "t.color.x1");
  assert.deepEqual(r.picks.color, ["t.color.duo", "t.color.x1"]);
  assert.deepEqual(pick(r, "t.color.mono").picks.color, ["t.color.x1", "t.color.mono"]);
});

test("衝突：未強制時不變並回報，強制時取代（雙向）", () => {
  const r = pick(emptyRecipe(domain), "t.color.x2");
  const blocked = toggle(domain, r, "t.color.mono");
  assert.equal(blocked.reason, "conflict");
  assert.deepEqual(blocked.blocked, ["t.color.x2"]);
  assert.equal(blocked.recipe, r);
  const forced = toggle(domain, r, "t.color.mono", { force: true });
  assert.deepEqual(forced.recipe.picks.color, ["t.color.mono"]);
  assert.deepEqual(forced.replaced, ["t.color.x2"]);

  const reverse = toggle(domain, pick(emptyRecipe(domain), "t.color.mono"), "t.color.x2");
  assert.equal(reverse.reason, "conflict");
});

test("未知模組不改變配方", () => {
  const r = emptyRecipe(domain);
  assert.equal(toggle(domain, r, "t.none.x").reason, "unknown");
});

test("reorder 移動順序，越界時不變", () => {
  const r = pick(emptyRecipe(domain), "t.part.p1", "t.part.p2", "t.part.p3");
  assert.deepEqual(reorder(r, "part", 0, 2).picks.part, ["t.part.p2", "t.part.p3", "t.part.p1"]);
  assert.equal(reorder(r, "part", 0, 9), r);
});

test("applyPreset 取代選取，但不覆蓋使用者已填的簡述", () => {
  const filled = { ...emptyRecipe(domain), brief: { ...emptyRecipe(domain).brief, name: "我的站" } };
  const r = applyPreset(domain, filled, "basic");
  assert.equal(r.brief.name, "我的站");
  assert.deepEqual(r.picks.part, ["t.part.p2", "t.part.p1"]);
  assert.equal(applyPreset(domain, emptyRecipe(domain), "basic").brief.name, "預設名稱");
});

test("sanitize 丟棄未知、放錯類別、重複與超量的選取", () => {
  const { recipe, dropped } = sanitize(domain, {
    brief: { name: "x".repeat(500), extra: 123, evil: "<img onerror=1>" },
    picks: {
      kind: ["t.kind.a", "t.kind.b", "t.part.p1", 42],
      part: ["t.part.p1", "t.part.p1", "t.part.p2", "t.part.p3", "t.part.p4"],
      bogus: ["x"],
      __proto__: ["y"],
    },
    styleId: { a: 1 },
    onUnclear: "whatever",
  });
  assert.deepEqual(recipe.picks, { kind: ["t.kind.a"], part: ["t.part.p1", "t.part.p2", "t.part.p3"] });
  assert.equal(recipe.brief.name.length, 80);
  assert.equal(recipe.brief.extra, "");
  assert.equal("evil" in recipe.brief, false);
  assert.equal(recipe.styleId, null);
  assert.equal(recipe.onUnclear, "assume");
  assert.ok(dropped.includes("t.kind.b") && dropped.includes("bogus") && dropped.includes("t.part.p4"));
});

test("sanitize 對非物件輸入回傳空配方", () => {
  for (const bad of [null, "str", 5, [], undefined]) {
    assert.deepEqual(sanitize(domain, bad).recipe.picks, {});
  }
});

test("check：必填、下限、衝突、相依", () => {
  const empty = check(domain, emptyRecipe(domain));
  assert.deepEqual(empty.map((i) => i.code), ["required", "required"]);

  const one = check(domain, pick(emptyRecipe(domain), "t.kind.a", "t.part.p1"));
  assert.deepEqual(one.map((i) => i.code), ["min"]);

  const form = check(domain, pick(emptyRecipe(domain), "t.kind.a", "t.part.p1", "t.part.p2", "t.tech.form"));
  assert.deepEqual(form.map((i) => i.code), ["requires"]);
  const ok = check(domain, pick(emptyRecipe(domain), "t.kind.a", "t.part.p1", "t.part.p2", "t.tech.form", "t.tech.server"));
  assert.deepEqual(ok, []);

  const clash = { ...emptyRecipe(domain), picks: { kind: ["t.kind.a"], part: ["t.part.p1", "t.part.p2"], color: ["t.color.mono", "t.color.x2"] } };
  assert.deepEqual(check(domain, clash).map((i) => i.code), ["conflict"]);
});

test("stepStatus 與 capabilities", () => {
  const r = pick(emptyRecipe(domain), "t.kind.a", "t.part.p1", "t.tech.server");
  assert.equal(stepStatus(domain, r, "kind"), "done");
  assert.equal(stepStatus(domain, r, "parts"), "partial");
  assert.equal(stepStatus(domain, emptyRecipe(domain), "parts"), "empty");
  assert.equal(stepStatus(domain, r, "start"), "empty");
  assert.equal(stepStatus(domain, pick(r, "t.tech.single", "t.tech.form"), "look"), "issue");
  assert.deepEqual(capabilities(domain, r), ["files", "shell"]);
});

test("assemble：空配方仍輸出任務、固定條款與驗收，必填缺漏有提示", () => {
  const { text, count } = assemble(domain, emptyRecipe(domain));
  assert.equal(count, 0);
  assert.match(text, /^# 任務\n製作一個東西。\n自行假設。/);
  assert.match(text, /## 定位\n- （未指定類型）/);
  assert.match(text, /## 技術\n- 固定交付條款。/);
  assert.match(text, /## 驗收\n- \[ \] 沒有錯誤。\n- \[ \] 附上假設清單。$/);
  assert.doesNotMatch(text, /## 結構|## 外觀|## 禁止|## 補充/);
});

test("assemble：行格式、順序、編號與驗收條件", () => {
  let r = pick(emptyRecipe(domain), "t.kind.b", "t.part.p3", "t.part.p1", "t.color.x1", "t.color.duo");
  r = { ...r, brief: { ...r.brief, name: "小站", extra: "第一行\n第二行" }, onUnclear: "ask" };
  const { text, blocks, count } = assemble(domain, r);
  assert.equal(count, 5);
  assert.match(text, /製作「小站」。\n先發問。/);
  assert.match(text, /- 類型：名稱-b（Name b）——做出 b。/);
  assert.match(text, /### 區塊\n1\. 名稱-p3（Name p3）：做出 p3。\n2\. 名稱-p1（Name p1）：做出 p1。/);
  // 非有序分組依資料檔順序：scheme 組在前
  assert.match(text, /### 色彩\n- 名稱-duo（Name duo）：做出 duo。\n- 名稱-x1（Name x1）：做出 x1。/);
  assert.match(text, /## 補充\n第一行\n第二行/);
  assert.match(text, /## 驗收\n- \[ \] p1 存在。\n- \[ \] 沒有錯誤。$/);
  const structure = blocks.find((b) => b.sectionId === "parts");
  assert.deepEqual(structure.lines.map((l) => l.moduleId), [undefined, "t.part.p3", "t.part.p1"]);
});

test("assemble：個人風格接管類別並輸出自己的行", () => {
  const r = pick(emptyRecipe(domain), "t.kind.a", "t.color.duo");
  const { text } = assemble(domain, r, style);
  assert.doesNotMatch(text, /### 色彩/);
  assert.match(text, /### 個人風格\n- 字體：標題用 Noto Serif TC；內文用 Noto Sans TC。\n- 色票（請原樣使用這些色碼）：背景 #FAF7F0、主要文字 #1A1A1A、強調色 #C2410C。/);
  assert.match(text, /- 招牌手法：標題左側加一條 2px 直線/);
  assert.match(text, /## 禁止\n- 不要使用漸層/);
});

test("assemble：輸出穩定，且不含 undefined 或空標題", () => {
  const r = pick(emptyRecipe(domain), "t.kind.a", "t.part.p1", "t.part.p2", "t.tech.single");
  const a = assemble(domain, r).text;
  assert.equal(a, assemble(domain, structuredClone(r)).text);
  assert.doesNotMatch(a, /undefined|\[object Object\]|##[^\n]*\n\n|##[^\n]*$/);
});
