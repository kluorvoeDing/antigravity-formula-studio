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
  const box = (cls, ...kids) => h("div", { class: cls }, kids);
  const nth = (tag, cls, i, ...kids) => h(tag, { class: cls, style: { "--i": i } }, kids);
  const cursor = () => h("i", { class: "pv-m-cursor" });
  const title = () => h("span", { class: "pv-m-title" }, bar("52%"));
  const feed = (n) => box("pv-m-window", box("pv-m-feed", Array.from({ length: n }, card)));
  const pill = () => box("pv-m-pill", bar("50%"));
  const shot = () => box("pv-m-shot", box("pv-m-photo", h("i", { class: "pv-m-pic" })), bar("70%"), bar("46%"));
  const scenes = {
    parallax: () => [box("pv-m-scene", box("pv-m-back", h("i"), h("i"), h("i")), box("pv-m-front", card(), card()))],
    "sticky-scroll": () => [box("pv-m-split", box("pv-m-pin", bar("70%"), bar("90%"), bar("56%")), feed(5))],
    "scroll-progress": () => [box("pv-m-progress", h("i", { class: "pv-m-fill" })), title(), feed(5)],
    "page-load-stagger": () => [
      nth("i", "pv-m-row pv-m-nav", 0),
      nth("div", "pv-m-row", 1, title()),
      nth("div", "pv-m-row", 2, bar("74%")),
      nth("div", "pv-m-row pv-m-cards", 3, card(), card(), card()),
    ],
    "text-reveal": () => [
      [0, 1, 2].map((i) => nth("div", "pv-m-mask", i, h("i", { class: "pv-m-word", style: { "--w": `${88 - i * 18}%` } }))),
      bar("80%"),
      bar("64%"),
    ],
    "view-transitions": () => [
      box(
        "pv-m-stage",
        box("pv-m-page-a", card(), card(), card()),
        box("pv-m-page-b", bar("62%"), bar("88%"), bar("74%")),
        h("i", { class: "pv-m-morph" }),
      ),
    ],
    "magnetic-button": () => [title(), box("pv-m-center", pill()), cursor()],
    "tilt-3d": () => [box("pv-m-persp", h("span", { class: "pv-m-card pv-m-tilt" }, bar("60%"), bar("84%"), bar("40%"))), cursor()],
    "cursor-follower": () => [title(), bar("84%"), bar("70%"), bar("78%"), h("i", { class: "pv-m-ring" }), cursor()],
    "count-up": () => [
      title(),
      box(
        "pv-m-stats",
        ["82%", "58%", "70%"].map((w, i) => box("pv-m-stat", nth("i", "pv-m-num", i), bar(w))),
      ),
    ],
    "button-press": () => [title(), box("pv-m-center", pill()), cursor()],
    "smooth-scroll": () => [box("pv-m-split", box("pv-m-links", bar("70%"), h("i", { class: "pv-line pv-m-link" }), bar("60%")), feed(5)), cursor()],
    "image-hover-zoom": () => [box("pv-m-shots", shot(), shot(), shot()), cursor()],
    "svg-line-drawing": () => [
      box(
        "pv-m-draw",
        nth("i", "pv-m-side pv-m-top", 0),
        nth("i", "pv-m-side pv-m-right", 1),
        nth("i", "pv-m-side pv-m-bottom", 2),
        nth("i", "pv-m-side pv-m-left", 3),
      ),
    ],
  };
  if (scenes[name]) return frame("motion", [`pv-m-${name}`], undefined, scenes[name]());
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
