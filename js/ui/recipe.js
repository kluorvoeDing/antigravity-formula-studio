// 右欄：已選的配方、待處理事項與提示詞。
import { h, mount } from "./dom.js";
import { indexDomain, orderedPicks } from "../engine/domain.js";
import { check, capabilities, SOFT_LIMIT } from "../engine/check.js";
import { assemble } from "../engine/assemble.js";
import { currentStyle } from "../state.js";
import { exportData, encodeShare } from "../persist.js";

const CAPABILITY_TEXT = {
  files: "建立檔案",
  shell: "執行指令",
  network: "連上網路",
};

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.className = "sr";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    area.remove();
    return ok;
  }
}

function download(filename, text, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountRecipe(el, store, domain, actions, toast, { openModule, builtinStyles = [], onUpdate = () => {} } = {}) {
  const ix = indexDomain(domain);
  let latest = { output: "", count: 0 };

  const copyOutput = async () => toast((await copyText(latest.output)) ? "已複製提示詞，可以貼給任何 AI 了" : "複製失敗，請手動選取文字複製");

  const fileInput = h("input", {
    type: "file",
    accept: "application/json,.json",
    class: "sr",
    tabindex: "-1",
    "aria-hidden": "true",
    on: {
      change: async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.size > 1_000_000) return toast("檔案太大，不像是配方圖鑑的匯出檔");
        let json;
        try {
          json = JSON.parse(await file.text());
        } catch {
          return toast("檔案不是有效的 JSON，無法匯入");
        }
        actions.importJson(json);
      },
    },
  });

  function exportRecipe() {
    const state = store.get();
    const name = state.recipe.brief.name || "配方";
    download(`${name}.json`, JSON.stringify(exportData(state, builtinStyles), null, 2), "application/json");
    toast("已匯出配方檔，可以在其他瀏覽器用「匯入」還原");
  }

  async function shareLink() {
    const code = encodeShare(domain, store.get().recipe);
    if (!code) return toast("還沒有選任何模組，沒有可以分享的內容");
    const url = `${location.origin}${location.pathname}?r=${encodeURIComponent(code)}#${domain.id}/start`;
    toast((await copyText(url)) ? "已複製分享連結（只含模組選取，不含簡述與個人風格）" : "複製失敗，請稍後再試");
  }
  const stepOf = new Map(domain.steps.flatMap((step, i) => (step.categories ?? []).map((id) => [id, { step, index: i }])));
  let lines = [];

  function renderPicked(state) {
    const groups = [];
    for (const [i, step] of domain.steps.entries()) {
      const items = [];
      for (const categoryId of step.categories ?? []) {
        const category = ix.categories.get(categoryId);
        const entries = orderedPicks(ix, state.recipe, categoryId);
        const raw = state.recipe.picks[categoryId] ?? [];
        entries.forEach(({ module, group }) => {
          const at = raw.indexOf(module.id);
          const sortable = group.ordered && category.groups.length === 1;
          items.push(
            h(
              "li",
              {},
              h(
                "button",
                { type: "button", class: "picked-name", title: "前往這個模組", on: { click: () => (openModule ? openModule(module.id) : actions.goStep(step.id)) } },
                module.zh,
              ),
              h(
                "span",
                { class: "picked-actions" },
                sortable && h("button", { type: "button", "aria-label": `${module.zh} 上移`, disabled: at === 0, on: { click: () => actions.movePick(categoryId, at, at - 1) } }, "↑"),
                sortable && h("button", { type: "button", "aria-label": `${module.zh} 下移`, disabled: at === raw.length - 1, on: { click: () => actions.movePick(categoryId, at, at + 1) } }, "↓"),
                h("button", { type: "button", "aria-label": `移除 ${module.zh}`, on: { click: () => actions.toggleModule(module.id) } }, "✕"),
              ),
            ),
          );
        });
      }
      if (items.length) groups.push(h("li", { class: "picked-group", data: { hue: i } }, h("p", {}, step.zh), h("ol", {}, items)));
    }
    return groups;
  }

  function render(state) {
    const style = currentStyle(state);
    const issues = check(domain, state.recipe, style);
    const { text, blocks, count } = assemble(domain, state.recipe, style);
    const needs = capabilities(domain, state.recipe);
    const manual = state.manualText !== null;
    const output = manual ? state.manualText : text;
    const brief = state.recipe.brief;
    const scroll = el.querySelector(".prompt-text")?.scrollTop ?? 0;
    const pickedScroll = el.querySelector(".picked")?.scrollTop ?? 0;
    lines = [];

    const body = manual
      ? h("textarea", { class: "prompt-text prompt-edit", "aria-label": "手動編輯提示詞", spellcheck: "false", on: { input: (event) => actions.setManual(event.target.value) } })
      : h(
          "div",
          { class: "prompt-text", tabindex: "0", role: "region", "aria-label": "提示詞內容" },
          blocks.map((block, i) =>
            h(
              "div",
              { class: "prompt-block" },
              h("p", { class: "prompt-title" }, `${i === 0 ? "#" : "##"} ${block.title}`),
              block.lines.map((line) => {
                const linked = line.moduleId && openModule;
                const node = h(
                  "p",
                  {
                    class: ["prompt-line", line.text.startsWith("### ") && "is-sub", linked && "is-linked"],
                    title: linked ? "點一下前往這個模組" : null,
                    on: linked ? { click: () => window.getSelection()?.isCollapsed !== false && openModule(line.moduleId) } : null,
                  },
                  line.text,
                );
                if (line.moduleId) lines.push({ id: line.moduleId, node });
                return node;
              }),
            ),
          ),
        );
    if (manual) body.value = state.manualText;

    const picked = renderPicked(state);
    mount(
      el,
      h(
        "header",
        { class: "recipe-head" },
        h("h2", {}, "你的配方"),
        h(
          "span",
          { class: "recipe-tools" },
          h("button", { type: "button", class: "text-button", on: { click: shareLink } }, "分享連結"),
          h("button", { type: "button", class: "text-button", on: { click: exportRecipe } }, "匯出"),
          h("button", { type: "button", class: "text-button", on: { click: () => fileInput.click() } }, "匯入"),
          h("button", { type: "button", class: "text-button", on: { click: () => actions.resetRecipe() } }, "清空"),
        ),
        fileInput,
      ),
      h("p", { class: "recipe-name" }, brief.name || "尚未命名的網站", brief.oneLiner && h("span", {}, brief.oneLiner), style && h("span", {}, `個人風格：${style.name}`)),
      picked.length ? h("ol", { class: "picked" }, picked) : h("p", { class: "empty" }, "還沒有選任何模組。從左邊的步驟開始，或在「起點」套用一個現成配方。"),
      issues.length > 0 &&
        h(
          "ul",
          { class: "issues" },
          issues.map((issue) => {
            const target = issue.categoryId ? stepOf.get(issue.categoryId) : stepOf.get(ix.modules.get(issue.ids[0])?.category.id);
            return h(
              "li",
              { class: `is-${issue.level}` },
              target ? h("button", { type: "button", on: { click: () => actions.goStep(target.step.id) } }, issue.msg) : issue.msg,
            );
          }),
        ),
      h(
        "section",
        { class: "prompt" },
        h(
          "header",
          { class: "prompt-head" },
          h("h2", {}, "提示詞"),
          h("span", { class: ["prompt-meta", count > SOFT_LIMIT && "is-over"] }, `${count} 個模組`),
          h(
            "button",
            {
              type: "button",
              class: "solid",
              on: {
                click: copyOutput,
              },
            },
            "複製提示詞",
          ),
        ),
        needs.length > 0 && h("p", { class: "needs-note" }, `這份配方需要能${needs.map((n) => CAPABILITY_TEXT[n]).join("、")}的 AI 工具。只能聊天的工具會改成逐檔輸出程式碼。`),
        manual && h("p", { class: "manual-note" }, "手動編輯中：之後更改配方不會更新這裡的文字。"),
        body,
        h(
          "div",
          { class: "prompt-foot" },
          manual
            ? h("button", { type: "button", class: "text-button", on: { click: () => actions.setManual(null) } }, "放棄修改，重新同步")
            : h("button", { type: "button", class: "text-button", on: { click: () => actions.setManual(text) } }, "手動編輯"),
          h("button", { type: "button", class: "text-button", on: { click: () => download(`${brief.name || "prompt"}.txt`, output) } }, "下載 .txt"),
        ),
      ),
    );
    latest = { output, count };
    onUpdate(latest);
    const box = el.querySelector(".prompt-text");
    if (box) box.scrollTop = scroll;
    const list = el.querySelector(".picked");
    if (list) list.scrollTop = pickedScroll;
  }

  store.subscribe((state, prev) => {
    if (state.manualText !== null && state.manualText !== prev.manualText) {
      latest = { ...latest, output: state.manualText };
      onUpdate(latest);
    }
    const typing = state.manualText !== null && prev.manualText !== null && state.recipe === prev.recipe && state.styles === prev.styles;
    if (typing) return;
    if (state.recipe !== prev.recipe || state.styles !== prev.styles || state.manualText !== prev.manualText) render(state);
  });
  render(store.get());

  return {
    copy: copyOutput,
    /** 標出提示詞中由某個模組產生的行，並捲到看得見的位置。 */
    highlight(moduleId) {
      let first = null;
      for (const { id, node } of lines) {
        const on = id === moduleId;
        node.classList.toggle("is-hot", on);
        if (on && !first) first = node;
      }
      const box = el.querySelector(".prompt-text");
      if (first && box && !box.matches("textarea")) {
        const top = first.offsetTop - box.offsetTop;
        if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 60) box.scrollTo({ top: Math.max(0, top - 40), behavior: "smooth" });
      }
    },
  };
}
