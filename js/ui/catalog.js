// 中欄：目前步驟的教學卡，或起點步驟的配方與專案簡述。
import { h, mount } from "./dom.js";
import { renderPreview } from "../preview/index.js";
import { indexDomain, picksInGroup } from "../engine/domain.js";
import { currentStyle } from "../state.js";
import { STYLE_OVERRIDES } from "../persist.js";

const NEEDS = { files: "需要能建立檔案的 AI", shell: "需要能執行指令的 AI", network: "需要能連網的 AI" };
const COLOR_LABELS = { bg: "背景", surface: "區塊底", fg: "文字", muted: "次要文字", accent: "強調", pop: "點綴" };

function ruleText(group) {
  if (group.mode === "one") return group.min > 0 ? "必選一個" : "單選，可以不選";
  const range = group.min > 0 ? `選 ${group.min} 到 ${group.max} 個` : `最多選 ${group.max} 個`;
  return group.ordered ? `${range}，選取順序就是頁面順序` : range;
}

export function mountCatalog(el, store, domain, actions, { highlight, editStyle }) {
  const ix = indexDomain(domain);
  let cards = new Map();
  let counters = new Map();

  function buttonLabel(state, module, group, category) {
    const order = (state.recipe.picks[category.id] ?? []).indexOf(module.id);
    if (order < 0) return "加入配方";
    return group.ordered ? `已加入，第 ${order + 1} 個` : "已加入";
  }

  function renderCard(state, module, category, group, number) {
    const picked = (state.recipe.picks[category.id] ?? []).includes(module.id);
    const figure = renderPreview(module.preview);
    const button = h(
      "button",
      { class: "add", type: "button", "aria-pressed": String(picked), on: { click: () => actions.toggleModule(module.id) } },
      buttonLabel(state, module, group, category),
    );
    const card = h(
      "article",
      {
        class: ["card", picked && "is-picked", !figure && "has-no-figure"],
        id: `m-${module.id}`,
        on: {
          mouseenter: () => highlight(module.id),
          mouseleave: () => highlight(null),
          focusin: () => highlight(module.id),
          focusout: () => highlight(null),
        },
      },
      figure
        ? h("div", { class: "card-figure" }, figure, h("span", { class: "card-no" }, number))
        : h("div", { class: "card-figure card-check" }, h("span", { class: "card-no" }, number), module.note && h("p", {}, module.note)),
      h(
        "div",
        { class: "card-body" },
        h("h3", { class: "card-name" }, h("span", { class: "zh" }, module.zh), h("span", { class: "en", lang: "en" }, module.en)),
        h("p", { class: "what" }, module.what),
        h(
          "div",
          { class: "uses" },
          h("section", { class: "use" }, h("h4", {}, "何時用"), h("ul", {}, module.when.map((t) => h("li", {}, t)))),
          h("section", { class: "use" }, h("h4", {}, "何時別用"), h("ul", {}, module.avoid.map((t) => h("li", {}, t)))),
        ),
        figure && module.note && h("p", { class: "note" }, module.note),
        module.needs?.length > 0 && h("p", { class: "needs" }, module.needs.map((n) => h("span", {}, NEEDS[n]))),
        h("div", { class: "card-foot" }, h("span", { class: "tags" }, module.tags.map((t) => h("span", {}, t))), button),
      ),
    );
    cards.set(module.id, { card, button, module, group, category });
    return card;
  }

  function renderStylePanel(state) {
    const style = currentStyle(state);
    const select = h(
      "select",
      { id: "style-select", on: { change: (event) => actions.chooseStyle(event.target.value || null) } },
      h("option", { value: "" }, "不使用個人風格"),
      state.styles.map((s) => h("option", { value: s.id, selected: s.id === style?.id }, s.name)),
    );
    select.value = style?.id ?? "";
    return h(
      "section",
      { class: "style-panel" },
      h("h2", {}, "個人風格"),
      h("p", {}, "把你固定使用的字體、色票與招牌手法存成一組。套用後會寫進每一份提示詞，讓不同的網站維持同一種樣子。"),
      h(
        "div",
        { class: "style-controls" },
        h("label", { for: "style-select", class: "sr" }, "選擇個人風格"),
        select,
        h("button", { type: "button", class: "ghost", on: { click: () => editStyle(null) } }, "新增風格"),
        style && h("button", { type: "button", class: "ghost", on: { click: () => editStyle(style) } }, style.id.startsWith("builtin-") ? "複製並修改" : "修改"),
        style && !style.id.startsWith("builtin-") && h("button", { type: "button", class: "ghost", on: { click: () => actions.deleteStyle(style.id) } }, "刪除"),
      ),
      style &&
        h(
          "div",
          { class: "style-summary" },
          h(
            "div",
            { class: "style-swatches" },
            Object.entries(COLOR_LABELS)
              .filter(([key]) => style.colors[key])
              .map(([key, label]) => h("span", {}, h("i", { style: { "--c": style.colors[key] } }), label, h("b", {}, style.colors[key]))),
          ),
          (style.fonts.display || style.fonts.body) && h("p", {}, `字體：${[style.fonts.display, style.fonts.body].filter(Boolean).join("／")}`),
          style.signature.length > 0 && h("ul", {}, style.signature.map((t) => h("li", {}, t))),
        ),
    );
  }

  function renderCategory(state, category, stepIndex, catIndex, multi) {
    const style = currentStyle(state);
    const taken = style && STYLE_OVERRIDES.includes(category.id) && style.overrides.includes(category.id);
    return h(
      "section",
      { class: ["category", taken && "is-taken"], id: `c-${category.id}` },
      multi && h("header", { class: "category-head" }, h("h2", {}, category.zh, h("span", { class: "en", lang: "en" }, category.en)), h("p", {}, category.intro)),
      taken && h("p", { class: "taken" }, `已由個人風格「${style.name}」決定。這一類的選擇不會寫進提示詞。`),
      category.groups.map((group) => {
        const modules = category.modules.filter((m) => (m.group ?? category.groups[0].id) === group.id);
        const counter = h("span", { class: "group-count" });
        counters.set(`${category.id}/${group.id}`, { el: counter, category, group });
        return h(
          "div",
          { class: "group" },
          h("p", { class: "group-rule" }, category.groups.length > 1 && h("strong", {}, group.zh), h("span", {}, ruleText(group)), counter),
          h("div", { class: "cards" }, modules.map((m) => renderCard(state, m, category, group, `${stepIndex}-${String(category.modules.indexOf(m) + 1).padStart(2, "0")}`))),
        );
      }),
    );
  }

  function stepNav(state) {
    const i = domain.steps.findIndex((s) => s.id === state.stepId);
    const prev = domain.steps[i - 1];
    const next = domain.steps[i + 1];
    return h(
      "nav",
      { class: "step-nav", "aria-label": "上一步與下一步" },
      prev ? h("button", { type: "button", class: "ghost", on: { click: () => actions.goStep(prev.id) } }, `上一步：${prev.zh}`) : h("span"),
      next ? h("button", { type: "button", class: "solid", on: { click: () => actions.goStep(next.id) } }, `下一步：${next.zh}`) : h("p", { class: "done-hint" }, "全部步驟都走完了。到右邊複製提示詞，貼給任何 AI。"),
    );
  }

  function field(state, key, label, hint, { multiline = false, rows = 3, placeholder = "" } = {}) {
    const id = `brief-${key}`;
    const props = { id, placeholder, on: { input: (event) => actions.setBrief(key, event.target.value) } };
    const control = multiline ? h("textarea", { ...props, rows }) : h("input", { ...props, type: "text" });
    control.value = state.recipe.brief[key] ?? "";
    return h("div", { class: ["field", multiline && "is-wide"] }, h("label", { for: id }, label), hint && h("p", { class: "field-hint" }, hint), control);
  }

  function renderStart(state) {
    const unclear = (value, label, hint) => {
      const input = h("input", { type: "radio", name: "unclear", value, on: { change: () => actions.setUnclear(value) } });
      input.checked = state.recipe.onUnclear === value;
      return h("label", { class: "choice" }, input, h("span", {}, h("strong", {}, label), hint));
    };
    return [
      h(
        "header",
        { class: "catalog-head" },
        h("p", { class: "catalog-step" }, "步驟 0"),
        h("h1", {}, "起點", h("span", { class: "en", lang: "en" }, "Start")),
        h("p", { class: "intro" }, domain.tagline),
      ),
      h(
        "section",
        { class: "category" },
        h("header", { class: "category-head" }, h("h2", {}, "從現成配方開始"), h("p", {}, "先套用一組完整的選擇，再到各步驟替換成你要的。套用會取代目前已選的模組。")),
        h(
          "div",
          { class: "presets" },
          domain.presets.map((preset) =>
            h(
              "article",
              { class: "preset" },
              h("h3", {}, preset.zh),
              h("p", {}, preset.what),
              h("p", { class: "preset-meta" }, `${Object.values(preset.picks).flat().length} 個模組`),
              h("button", { type: "button", class: "solid", on: { click: () => actions.usePreset(preset.id) } }, "套用這個配方"),
            ),
          ),
        ),
      ),
      h(
        "section",
        { class: "category" },
        h("header", { class: "category-head" }, h("h2", {}, "描述你的網站"), h("p", {}, "全部選填。寫得越具體，AI 產出的文案與內容越貼近你要的。")),
        h(
          "div",
          { class: "form" },
          field(state, "name", "網站或產品名稱", "", { placeholder: "例如：Tidepool" }),
          field(state, "oneLiner", "一句話定位", "", { placeholder: "例如：給小型團隊的排班工具，三分鐘排好一週班表" }),
          field(state, "audience", "目標受眾", "誰會來看、他們在意什麼。", { placeholder: "例如：10 到 50 人餐飲店的店長" }),
          field(state, "goal", "訪客該完成的事", "看完之後你希望他們做什麼。", { placeholder: "例如：註冊 14 天免費試用" }),
          field(state, "content", "可使用的內容素材", "手邊已有的文字、數字、功能清單、客戶名稱，直接貼上來。", { multiline: true, rows: 5 }),
          field(state, "extra", "補充說明", "其他任何想交代的事。會原樣放進提示詞的「補充說明」。", { multiline: true, rows: 3 }),
          field(state, "lang", "介面與文案語言", "", {}),
          h(
            "fieldset",
            { class: "field is-wide" },
            h("legend", {}, "規格沒寫到的地方，AI 該怎麼辦"),
            unclear("assume", "直接做，最後列出假設", "適合想一次拿到成品的情況。"),
            unclear("ask", "先問我，再開始做", "適合方向還不確定、願意來回一次的情況。"),
          ),
        ),
      ),
      stepNav(state),
    ];
  }

  function renderStep(state) {
    const stepIndex = domain.steps.findIndex((s) => s.id === state.stepId);
    const step = domain.steps[stepIndex];
    const categories = step.categories.map((id) => ix.categories.get(id));
    const multi = categories.length > 1;
    const lead = categories[0];
    return [
      h(
        "header",
        { class: "catalog-head" },
        h("p", { class: "catalog-step" }, `步驟 ${stepIndex}`),
        h("h1", {}, multi ? step.zh : lead.zh, !multi && h("span", { class: "en", lang: "en" }, lead.en)),
        h("p", { class: "intro" }, multi ? step.hint : lead.intro),
      ),
      step.id === "style" && renderStylePanel(state),
      categories.map((category, i) => renderCategory(state, category, stepIndex, i, multi)),
      stepNav(state),
    ];
  }

  function patch(state) {
    for (const { card, button, module, group, category } of cards.values()) {
      const picked = (state.recipe.picks[category.id] ?? []).includes(module.id);
      card.classList.toggle("is-picked", picked);
      button.setAttribute("aria-pressed", String(picked));
      const label = buttonLabel(state, module, group, category);
      if (button.textContent !== label) button.textContent = label;
    }
    for (const { el: counter, category, group } of counters.values()) {
      const n = picksInGroup(ix, state.recipe, category.id, group.id).length;
      const text = group.mode === "one" ? (n ? "已選" : "未選") : `已選 ${n} 個`;
      if (counter.textContent !== text) counter.textContent = text;
      counter.classList.toggle("is-short", n < group.min);
    }
  }

  function render(state) {
    cards = new Map();
    counters = new Map();
    const step = domain.steps.find((s) => s.id === state.stepId);
    mount(el, step.kind === "start" ? renderStart(state) : renderStep(state));
    patch(state);
  }

  store.subscribe((state, prev) => {
    const styleChanged = state.styles !== prev.styles || state.recipe.styleId !== prev.recipe.styleId;
    if (state.stepId !== prev.stepId) {
      render(state);
      window.scrollTo({ top: 0 });
      el.focus({ preventScroll: true });
    } else if (state.rev !== prev.rev || (styleChanged && state.stepId === "style")) render(state);
    else if (state.recipe !== prev.recipe) patch(state);
  });
  render(store.get());
}
