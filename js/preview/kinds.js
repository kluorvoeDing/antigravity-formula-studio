// 線框以外的預覽類型。全部由宣告式規格產生，數值只透過 CSS 自訂屬性與固定的類別名稱套用。
import { h } from "../ui/dom.js";

const frame = (kind, extra, style, ...children) =>
  h("div", { class: ["pv", "pv-desktop", `pv-${kind}`, ...extra], style, "aria-hidden": "true" }, children);
const bar = (w) => h("i", { class: "pv-line", style: { "--w": w } });

export function renderSpecimen(s) {
  return frame(
    "specimen",
    [`pv-border-${s.border}`, `pv-shadow-${s.shadow}`, `pv-font-${s.font}`, `pv-weight-${s.weight}`, s.effect && `pv-effect-${s.effect}`],
    { "--s-bg": s.bg, "--s-fg": s.fg, "--s-accent": s.accent, "--s-surface": s.surface ?? s.bg, "--s-radius": `${s.radius}px` },
    h("div", { class: "pv-s-head" }, "標題 Aa"),
    h("div", { class: "pv-s-text" }, "內文示意，看對比與字重。"),
    h("div", { class: "pv-s-row" }, h("span", { class: "pv-s-btn" }, "按鈕"), h("span", { class: "pv-s-card" }, bar("70%"), bar("46%"))),
  );
}

export function renderType(s) {
  return frame(
    "type",
    [],
    undefined,
    h("div", { class: ["pv-t-head", `pv-font-${s.display}`, `pv-weight-${s.weight}`, `pv-track-${s.tracking}`, `pv-size-${s.size}`] }, s.heading),
    h("div", { class: ["pv-t-text", `pv-font-${s.body}`] }, s.text),
  );
}

export function renderPalette(s) {
  return frame(
    "palette",
    [],
    undefined,
    h("div", { class: "pv-p-bar" }, s.colors.map((c) => h("i", { style: { "--c": c.hex, "--share": c.share } }))),
    h(
      "div",
      { class: "pv-p-legend" },
      s.colors.map((c) => h("span", {}, h("i", { style: { "--c": c.hex } }), c.name, h("b", {}, c.hex.toUpperCase()))),
    ),
  );
}

export function renderShape(s) {
  return frame(
    "shape",
    [`pv-border-${s.border}`, `pv-shadow-${s.shadow}`, `pv-gap-${s.gap}`],
    { "--s-radius": `${s.radius}px` },
    h("span", { class: "pv-sh-box pv-sh-big" }, bar("60%"), bar("84%"), h("span", { class: "pv-sh-btn" })),
    h("span", { class: "pv-sh-col" }, h("span", { class: "pv-sh-box" }, bar("70%")), h("span", { class: "pv-sh-box" }, bar("50%"))),
  );
}

const card = () => h("span", { class: "pv-m-card" }, bar("60%"), bar("84%"));

export function renderMotion(s) {
  const name = s.name;
  if (name === "marquee") {
    const strip = () => Array.from({ length: 6 }, () => h("i", { class: "pv-m-logo" }));
    return frame("motion", ["pv-m-marquee"], undefined, bar("40%"), h("div", { class: "pv-m-track" }, h("div", { class: "pv-m-strip" }, strip(), strip())));
  }
  return frame(
    "motion",
    [`pv-m-${name}`],
    undefined,
    h("span", { class: "pv-m-title" }, bar("52%")),
    h("div", { class: "pv-m-cards" }, card(), card(), card()),
    name === "hover-lift" && h("i", { class: "pv-m-cursor" }),
  );
}

export function renderTree(s) {
  return frame("tree", [], undefined, s.lines.map((text) => h("div", {}, text)));
}

export function renderCopy(s) {
  return frame(
    "copy",
    [],
    undefined,
    h("div", { class: "pv-c-head" }, s.headline),
    s.body && h("div", { class: "pv-c-body" }, s.body),
    s.cta && h("span", { class: "pv-c-cta" }, s.cta),
  );
}

export function renderVersus(s) {
  return frame(
    "versus",
    [],
    undefined,
    h("div", { class: "pv-v-side pv-v-dont" }, h("b", {}, "不要"), h("span", {}, s.dont)),
    h("div", { class: "pv-v-side pv-v-do" }, h("b", {}, "改成"), h("span", {}, s.do)),
  );
}
