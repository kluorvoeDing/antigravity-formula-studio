// 版面線框預覽：把宣告式的 rows 規格畫成中性線框。
import { h } from "../ui/dom.js";

const line = (w) => h("i", { class: "pv-line", style: { "--w": w } });
const box = (cls) => h("i", { class: ["pv-box", cls] });
const times = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

const PRIMS = {
  nav: () => [box("pv-dot"), h("span", { class: "pv-grow" }), line("12%"), line("12%"), line("12%"), box("pv-pill")],
  h1: () => [line("78%"), line("52%")],
  h2: () => [line("46%")],
  p: () => [line("92%"), line("84%"), line("60%")],
  btn: () => [box("pv-pill pv-solid")],
  btns: () => [box("pv-pill pv-solid"), box("pv-pill")],
  link: () => [line("24%")],
  img: () => [box("pv-img")],
  video: () => [h("i", { class: "pv-box pv-img pv-video" })],
  card: () => [h("span", { class: "pv-card" }, box("pv-dot"), line("60%"), line("88%"))],
  cards3: () => times(3, () => h("span", { class: "pv-card" }, box("pv-dot"), line("60%"), line("88%"))),
  cards4: () => times(4, () => h("span", { class: "pv-card" }, box("pv-dot"), line("70%"))),
  logos: () => times(5, () => box("pv-logo")),
  quote: () => [h("span", { class: "pv-card" }, line("90%"), line("72%"), h("span", { class: "pv-row" }, box("pv-dot"), line("30%")))],
  avatar: () => [box("pv-dot pv-big")],
  stat: () => [h("span", { class: "pv-stat" }, line("40%"), line("64%"))],
  stats3: () => times(3, () => h("span", { class: "pv-stat" }, line("40%"), line("64%"))),
  table: () => times(4, () => h("span", { class: "pv-row pv-rule" }, line("22%"), line("30%"), line("18%"))),
  form: () => [box("pv-input"), box("pv-input"), box("pv-pill pv-solid")],
  input: () => [box("pv-input")],
  list: () => times(3, () => h("span", { class: "pv-row" }, box("pv-dot"), line("70%"))),
  accordion: () => [
    h("span", { class: "pv-row pv-rule" }, line("54%"), h("span", { class: "pv-grow" }), box("pv-chev pv-open")),
    line("86%"),
    line("62%"),
    ...times(3, () => h("span", { class: "pv-row pv-rule" }, line("48%"), h("span", { class: "pv-grow" }), box("pv-chev"))),
  ],
  tabs: () => [box("pv-pill pv-solid pv-small"), box("pv-pill pv-small"), box("pv-pill pv-small")],
  footer: () => [line("18%"), h("span", { class: "pv-grow" }), line("10%"), line("10%"), line("10%")],
  chip: () => [box("pv-pill pv-small")],
  chips: () => times(4, () => box("pv-pill pv-small")),
  divider: () => [h("i", { class: "pv-hr" })],
  sidebar: () => [line("70%"), line("50%"), line("60%"), line("44%"), line("56%")],
  space: () => [],
  price3: () => times(3, (i) => h("span", { class: ["pv-card pv-price", i === 1 && "pv-featured"] }, line("40%"), line("56%"), line("80%"), line("72%"), box("pv-pill pv-solid"))),
  cols4: () => times(4, () => h("span", { class: "pv-col" }, line("50%"), line("74%"), line("62%"), line("68%"))),
};

function renderCell(cell) {
  const spec = typeof cell === "string" ? { t: cell } : cell;
  const classes = ["pv-cell", `pv-${spec.t}`, spec.hl && "is-hl"];
  const style = spec.span ? { "--span": spec.span } : undefined;
  if (spec.t === "stack") return h("span", { class: classes, style }, (spec.items ?? []).map(renderCell));
  return h("span", { class: classes, style }, (PRIMS[spec.t] ?? PRIMS.space)());
}

export function renderWire(spec) {
  return h(
    "div",
    { class: ["pv", "pv-wire", `pv-${spec.frame === "mobile" ? "mobile" : "desktop"}`], "aria-hidden": "true" },
    (spec.rows ?? []).map((row) => h("div", { class: "pv-rowline" }, row.map(renderCell))),
  );
}
