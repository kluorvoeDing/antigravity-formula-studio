import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDomain } from "./fixture.mjs";
import { sanitizeStyle, migrateLegacy, restore, snapshot, parseHash } from "../js/persist.js";

const domain = makeDomain();
const builtin = [{ id: "builtin-a", name: "內建", fonts: {}, colors: {}, radius: "", spacing: "", signature: [], avoid: [], overrides: [] }];

test("sanitizeStyle 只留下合法欄位", () => {
  const style = sanitizeStyle({
    id: "my style<script>",
    name: "  我的風格  ",
    fonts: { display: "Noto Serif TC", body: 42 },
    colors: { bg: "#ffffff", fg: "red", accent: "#12345", pop: "#ABCDEF", evil: "#000000" },
    radius: "x".repeat(500),
    signature: ["一", "", 3, "二", "三", "四", "五", "六", "七"],
    avoid: "不是陣列",
    overrides: ["color", "bogus", "shape"],
  });
  assert.equal(style.id, "mystylescript");
  assert.equal(style.name, "我的風格");
  assert.deepEqual(style.fonts, { display: "Noto Serif TC", body: "", mono: "" });
  assert.deepEqual(style.colors, { bg: "#FFFFFF", pop: "#ABCDEF" });
  assert.equal(style.radius.length, 120);
  assert.deepEqual(style.signature, ["一", "二", "三", "四", "五", "六"]);
  assert.deepEqual(style.avoid, []);
  assert.deepEqual(style.overrides, ["color", "shape"]);
});

test("sanitizeStyle 對缺少名稱或非物件回傳 null", () => {
  for (const bad of [null, "x", 1, {}, { id: "a" }, { name: "b" }]) assert.equal(sanitizeStyle(bad), null);
});

test("migrateLegacy 只搬使用者自訂的舊風格", () => {
  const styles = migrateLegacy({
    dnaProfiles: {
      craft: { name: "內建舊風格", bg: "#FFFFFF", fg: "#000000", accent: "#0052FF", pop: "#FF0000" },
      mine: { name: "我的舊風格", fontVibe: "圓潤", radiusSpacing: "24px 圓角", signatureTouch: "膠囊按鈕、雙層邊框", bg: "#101010", fg: "#FAFAFA", accent: "#00FF88", pop: "#FF00AA" },
    },
  });
  assert.equal(styles.length, 1);
  assert.equal(styles[0].id, "v3-mine");
  assert.equal(styles[0].radius, "24px 圓角");
  assert.deepEqual(styles[0].signature, ["字體氣質：圓潤", "膠囊按鈕", "雙層邊框"]);
  assert.deepEqual(styles[0].colors, { bg: "#101010", fg: "#FAFAFA", accent: "#00FF88", pop: "#FF00AA" });
  assert.deepEqual(migrateLegacy(null), []);
});

test("restore：沒有存檔時用預設配方，並搬入舊版風格", () => {
  const state = restore(null, domain, builtin, { dnaProfiles: { mine: { name: "舊", bg: "#101010", fg: "#FAFAFA", accent: "#00FF88" } } });
  assert.deepEqual(state.recipe.picks, { color: ["t.color.x1"] });
  assert.equal(state.stepId, "start");
  assert.deepEqual(state.styles.map((s) => s.id), ["builtin-a", "v3-mine"]);
});

test("restore：清理惡意或損壞的存檔", () => {
  const state = restore(
    {
      stepId: "nope",
      recipes: { t: { picks: { kind: ["t.kind.a", "<img onerror=1>"], bogus: ["x"] }, styleId: "ghost", brief: { name: "<b>站</b>" } } },
      styles: [{ id: "builtin-a", name: "冒名" }, { id: "ok", name: "可用" }, "壞的", { id: "ok", name: "重複" }],
    },
    domain,
    builtin,
  );
  assert.deepEqual(state.recipe.picks, { kind: ["t.kind.a"] });
  assert.equal(state.recipe.styleId, null);
  assert.equal(state.recipe.brief.name, "<b>站</b>");
  assert.equal(state.stepId, "start");
  assert.deepEqual(state.styles.map((s) => s.name), ["內建", "可用"]);
});

test("snapshot 與 restore 可以來回，且不存內建風格", () => {
  const first = restore({ stepId: "parts", recipes: { t: { picks: { kind: ["t.kind.b"] }, styleId: "ok" } }, styles: [{ id: "ok", name: "可用" }] }, domain, builtin);
  const saved = snapshot(first, builtin);
  assert.deepEqual(saved.styles.map((s) => s.id), ["ok"]);
  const second = restore(JSON.parse(JSON.stringify(saved)), domain, builtin);
  assert.deepEqual(second.recipe, first.recipe);
  assert.equal(second.stepId, "parts");
  assert.equal(second.recipe.styleId, "ok");
});

test("parseHash 只接受這個主題存在的步驟", () => {
  assert.equal(parseHash("#t/parts", domain), "parts");
  assert.equal(parseHash("#t/nope", domain), null);
  assert.equal(parseHash("#other/parts", domain), null);
  assert.equal(parseHash("", domain), null);
});
