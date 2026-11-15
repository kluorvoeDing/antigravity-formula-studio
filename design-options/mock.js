// 外觀方向試作（選定後整個資料夾會刪除）。用真實資料與引擎，只有版面是試作。
import web from "../data/web/index.js";
import { h, mount } from "../js/ui/dom.js";
import { renderWire } from "../js/preview/wire.js";
import { defaultRecipe, indexDomain, orderedPicks } from "../js/engine/domain.js";
import { toggle, reorder } from "../js/engine/select.js";
import { check, stepStatus } from "../js/engine/check.js";
import { assemble } from "../js/engine/assemble.js";

const THEMES = [
  ["a", "A 製圖桌"],
  ["b", "B 色票型錄"],
  ["c", "C 辭典"],
];
const HUES = { start: "#1c1c1c", type: "#ff4d2e", layout: "#ff9f0a", sections: "#00a86b", components: "#00a7c8", style: "#e0218a", motion: "#7a4dff", media: "#9bbf00", tech: "#2f6bff", voice: "#8a5a2b" };
const STATUS = { done: "已完成", partial: "未選完", issue: "有衝突", empty: "" };
const CURRENT = "sections";

const domain = web;
const ix = indexDomain(domain);
let recipe = defaultRecipe(domain);
for (const id of ["navbar-sticky", "hero-split", "feature-grid", "pricing-table", "footer-columns"]) {
  recipe = toggle(domain, recipe, `web.section.${id}`).recipe;
}
recipe.brief.name = "Tidepool";
recipe.brief.oneLiner = "給小型團隊的排班工具，三分鐘排好一週班表。";

const root = document.getElementById("app");
let theme = "a";
try {
  theme = localStorage.getItem("mock-theme") || "a";
} catch {}

function setTheme(next) {
  theme = next;
  document.body.dataset.theme = next;
  try {
    localStorage.setItem("mock-theme", next);
  } catch {}
  render();
}

function act(fn) {
  recipe = fn(recipe);
  render();
}

function renderTop() {
  return h(
    "header",
    { class: "top" },
    h("a", { class: "brand", href: "#" }, h("span", { class: "brand-zh" }, "配方圖鑑"), h("span", { class: "brand-en" }, "Prompt Field Guide")),
    h(
      "nav",
      { class: "domains", "aria-label": "主題" },
      ["網頁生成", "動態影片", "圖片生成", "Flow 影片"].map((name, i) => h("a", { href: "#", class: i === 0 && "is-current", "aria-current": i === 0 && "page" }, name)),
    ),
    h("label", { class: "search" }, h("span", { class: "sr" }, "搜尋名詞"), h("input", { type: "search", placeholder: "搜尋名詞，例如 hero、定價、視差" })),
  );
}

function renderSteps() {
  return h(
    "nav",
    { class: "steps", "aria-label": "步驟" },
    h(
      "ol",
      {},
      domain.steps.map((step, i) => {
        const status = stepStatus(domain, recipe, step.id);
        return h(
          "li",
          { class: ["step", `is-${status}`, step.id === CURRENT && "is-current"], style: { "--hue": HUES[step.id] } },
          h(
            "a",
            { href: "#", "aria-current": step.id === CURRENT && "step" },
            h("span", { class: "step-no" }, String(i)),
            h("span", { class: "step-name" }, step.zh),
            h("span", { class: "step-hint" }, step.hint),
            STATUS[status] && h("span", { class: "step-status" }, STATUS[status]),
          ),
        );
      }),
    ),
  );
}

function renderCard(module, index) {
  const picks = recipe.picks.section ?? [];
  const order = picks.indexOf(module.id);
  const picked = order >= 0;
  return h(
    "article",
    {
      class: ["card", picked && "is-picked"],
      data: { id: module.id },
      on: {
        mouseenter: () => (document.body.dataset.hot = module.id, markHot()),
        mouseleave: () => (delete document.body.dataset.hot, markHot()),
      },
    },
    h("div", { class: "card-figure" }, renderWire(module.preview), h("span", { class: "card-no" }, `3-${String(index + 1).padStart(2, "0")}`)),
    h(
      "div",
      { class: "card-body" },
      h("h3", { class: "card-name" }, h("span", { class: "zh" }, module.zh), " ", h("span", { class: "en", lang: "en" }, module.en)),
      h("p", { class: "what" }, module.what),
      h(
        "div",
        { class: "uses" },
        h("section", { class: "use when" }, h("h4", {}, "何時用"), h("ul", {}, module.when.map((t) => h("li", {}, t)))),
        h("section", { class: "use avoid" }, h("h4", {}, "何時別用"), h("ul", {}, module.avoid.map((t) => h("li", {}, t)))),
      ),
      h(
        "div",
        { class: "card-foot" },
        h("span", { class: "tags" }, module.tags.map((t) => h("span", { class: "tag" }, t))),
        h(
          "button",
          { class: "add", type: "button", "aria-pressed": String(picked), on: { click: () => act((r) => toggle(domain, r, module.id).recipe) } },
          picked ? `已加入，第 ${order + 1} 個` : "加入配方",
        ),
      ),
    ),
  );
}

function renderCatalog() {
  const category = ix.categories.get("section");
  const group = category.groups[0];
  const count = (recipe.picks.section ?? []).length;
  const first = category.modules[0].zh;
  const last = category.modules.at(-1).zh;
  return h(
    "main",
    { class: "catalog", style: { "--hue": HUES[CURRENT] } },
    h("p", { class: "guide-words", "aria-hidden": "true" }, h("span", {}, first), h("span", {}, last)),
    h(
      "header",
      { class: "catalog-head" },
      h("p", { class: "catalog-step" }, "步驟 3"),
      h("h1", {}, category.zh, " ", h("span", { class: "en", lang: "en" }, category.en)),
      h("p", { class: "intro" }, category.intro),
      h("p", { class: "rule" }, `選 ${group.min} 到 ${group.max} 個`, h("span", { class: "rule-count" }, `目前 ${count} 個`)),
    ),
    h("div", { class: "cards" }, category.modules.map(renderCard)),
  );
}

function renderRecipe() {
  const entries = orderedPicks(ix, recipe, "section");
  const issues = check(domain, recipe);
  const { blocks, count } = assemble(domain, recipe);
  return h(
    "aside",
    { class: "recipe", "aria-label": "你的配方" },
    h("h2", {}, "你的配方"),
    h("p", { class: "recipe-name" }, recipe.brief.name, h("span", {}, recipe.brief.oneLiner)),
    h(
      "ol",
      { class: "picked" },
      entries.map(({ module }, i) =>
        h(
          "li",
          { style: { "--hue": HUES.sections } },
          h("span", { class: "picked-name" }, module.zh),
          h(
            "span",
            { class: "picked-actions" },
            h("button", { type: "button", "aria-label": `${module.zh} 上移`, disabled: i === 0, on: { click: () => act((r) => reorder(r, "section", i, i - 1)) } }, "↑"),
            h("button", { type: "button", "aria-label": `${module.zh} 下移`, disabled: i === entries.length - 1, on: { click: () => act((r) => reorder(r, "section", i, i + 1)) } }, "↓"),
            h("button", { type: "button", "aria-label": `移除 ${module.zh}`, on: { click: () => act((r) => toggle(domain, r, module.id).recipe) } }, "✕"),
          ),
        ),
      ),
    ),
    issues.length > 0 &&
      h("ul", { class: "todo" }, issues.map((issue) => h("li", {}, issue.msg))),
    h(
      "section",
      { class: "prompt" },
      h("header", { class: "prompt-head" }, h("h2", {}, "提示詞"), h("span", { class: "prompt-meta" }, `${count} 個模組`), h("button", { class: "copy", type: "button" }, "複製提示詞")),
      h(
        "div",
        { class: "prompt-text", tabindex: "0" },
        blocks.map((block) =>
          h(
            "div",
            { class: "prompt-block" },
            h("p", { class: "prompt-title" }, block.title),
            block.lines.map((line) => h("p", { class: ["prompt-line", line.text.startsWith("### ") && "is-sub"], data: line.moduleId ? { module: line.moduleId } : {} }, line.text.replace(/^### /, ""))),
          ),
        ),
      ),
    ),
  );
}

function markHot() {
  const hot = document.body.dataset.hot;
  for (const el of document.querySelectorAll(".prompt-line")) el.classList.toggle("is-hot", Boolean(hot) && el.dataset.module === hot);
}

function renderSwitch() {
  return h(
    "div",
    { class: "switch", role: "group", "aria-label": "外觀方向" },
    h("span", {}, "外觀方向"),
    THEMES.map(([id, name]) => h("button", { type: "button", "aria-pressed": String(theme === id), on: { click: () => setTheme(id) } }, name)),
  );
}

function render() {
  const scroll = document.querySelector(".prompt-text")?.scrollTop ?? 0;
  mount(root, renderTop(), h("div", { class: "shell" }, renderSteps(), renderCatalog(), renderRecipe()), renderSwitch());
  const box = document.querySelector(".prompt-text");
  if (box) box.scrollTop = scroll;
}

const wanted = new URLSearchParams(location.search).get("d");
setTheme(THEMES.some(([id]) => id === wanted) ? wanted : theme);
