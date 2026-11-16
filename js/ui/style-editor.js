// 個人風格的編輯視窗（原生 dialog）。
import { h, mount } from "./dom.js";

const COLORS = [
  ["bg", "背景", true],
  ["fg", "主要文字", true],
  ["accent", "強調色", true],
  ["surface", "卡片與區塊底色", false],
  ["muted", "次要文字", false],
  ["pop", "點綴色", false],
];
const OVERRIDES = [
  ["typography", "字體排印"],
  ["color", "色彩"],
  ["shape", "間距與形狀"],
];
const DEFAULT_COLORS = { bg: "#FFFFFF", fg: "#161616", accent: "#00A86B" };

export function createStyleEditor(parent, actions) {
  const dialog = h("dialog", { class: "style-editor", "aria-labelledby": "style-editor-title" });
  parent.append(dialog);

  function open(style) {
    const builtin = style?.id.startsWith("builtin-");
    const base = style ?? { fonts: {}, colors: {}, signature: [], avoid: [], overrides: ["typography", "color", "shape"] };
    const id = style && !builtin ? style.id : `my-${Date.now().toString(36)}`;

    const text = (name, label, value, hint, placeholder = "") => {
      const input = h("input", { type: "text", name, id: `se-${name}`, placeholder, maxlength: "120" });
      input.value = value ?? "";
      return h("div", { class: "field" }, h("label", { for: `se-${name}` }, label), hint && h("p", { class: "field-hint" }, hint), input);
    };
    const area = (name, label, values, hint) => {
      const input = h("textarea", { name, id: `se-${name}`, rows: "3" });
      input.value = (values ?? []).join("\n");
      return h("div", { class: "field is-wide" }, h("label", { for: `se-${name}` }, label), h("p", { class: "field-hint" }, hint), input);
    };
    const color = ([key, label, required]) => {
      const value = base.colors[key] ?? DEFAULT_COLORS[key] ?? "";
      const picker = h("input", { type: "color", id: `se-color-${key}`, name: `color-${key}` });
      picker.value = value || "#888888";
      const use = h("input", { type: "checkbox", name: `use-${key}`, "aria-label": `使用${label}` });
      use.checked = required || Boolean(base.colors[key]);
      return h("div", { class: "color-field" }, h("label", { for: `se-color-${key}` }, label), picker, !required && h("label", { class: "color-use" }, use, "使用"));
    };

    const form = h(
      "form",
      {
        method: "dialog",
        on: {
          submit: (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const linesOf = (name) => String(data.get(name) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
            const colors = {};
            for (const [key, , required] of COLORS) if (required || data.get(`use-${key}`)) colors[key] = data.get(`color-${key}`);
            const saved = actions.saveStyle({
              id,
              name: data.get("name"),
              fonts: { display: data.get("display"), body: data.get("body") },
              colors,
              radius: data.get("radius"),
              spacing: data.get("spacing"),
              signature: linesOf("signature"),
              avoid: linesOf("avoid"),
              overrides: OVERRIDES.map(([key]) => key).filter((key) => data.get(`override-${key}`)),
            });
            if (saved) dialog.close();
            else form.querySelector("#se-name").focus();
          },
        },
      },
      h("h2", { id: "style-editor-title" }, style && !builtin ? "修改個人風格" : "新增個人風格"),
      h("p", { class: "field-hint" }, "這些內容會原樣寫進提示詞的「個人風格」段落，並註明與其他選擇衝突時以它為準。"),
      h(
        "div",
        { class: "form" },
        text("name", "風格名稱", builtin ? `${style.name}（我的版本）` : base.name, "", "例如：我的工作室風格"),
        h("span"),
        text("display", "標題字體", base.fonts.display, "寫字體名稱；可加上字重。", "例如：Noto Serif TC 字重 900"),
        text("body", "內文字體", base.fonts.body, "", "例如：Noto Sans TC"),
        h("fieldset", { class: "field is-wide" }, h("legend", {}, "色票"), h("div", { class: "color-grid" }, COLORS.map(color))),
        text("radius", "圓角", base.radius, "", "例如：卡片 16px、按鈕全圓角"),
        text("spacing", "間距", base.spacing, "", "例如：以 8px 為單位，區塊間距 96px"),
        area("signature", "招牌手法", base.signature, "每行一條。寫下你每個網站都會出現、別人一看就認得的做法。"),
        area("avoid", "一律不要", base.avoid, "每行一條。會加進提示詞的「禁止事項」。"),
        h(
          "fieldset",
          { class: "field is-wide" },
          h("legend", {}, "由這個風格決定，不再另外選擇"),
          h(
            "div",
            { class: "override-row" },
            OVERRIDES.map(([key, label]) => {
              const box = h("input", { type: "checkbox", name: `override-${key}` });
              box.checked = base.overrides.includes(key);
              return h("label", { class: "choice" }, box, h("span", {}, label));
            }),
          ),
        ),
      ),
      h(
        "div",
        { class: "dialog-actions" },
        h("button", { type: "button", class: "ghost", on: { click: () => dialog.close() } }, "取消"),
        h("button", { type: "submit", class: "solid" }, "儲存並套用"),
      ),
    );
    mount(dialog, form);
    dialog.showModal();
    form.querySelector("#se-name").required = true;
  }

  return { open };
}
