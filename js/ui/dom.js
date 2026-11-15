// 全站唯一的 DOM 建構入口。只用 createElement 與 textContent，不解析任何 HTML 字串。

const SVG_NS = "http://www.w3.org/2000/svg";
const SAFE_HREF = /^(https:\/\/|\.{0,2}\/|#|[\w-]+\.html)/;

function append(el, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) return child.forEach((c) => append(el, c));
  el.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

function apply(el, props) {
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.setAttribute("class", Array.isArray(value) ? value.filter(Boolean).join(" ") : value);
    else if (key === "data") for (const [k, v] of Object.entries(value)) el.dataset[k] = v;
    else if (key === "style") for (const [k, v] of Object.entries(value)) el.style.setProperty(k, String(v));
    else if (key === "on") for (const [type, fn] of Object.entries(value)) el.addEventListener(type, fn);
    else if (key.startsWith("on")) throw new Error(`h(): 事件請用 on: { ${key.slice(2)}: fn }`);
    else if (key === "href") {
      if (!SAFE_HREF.test(value)) throw new Error(`h(): 不允許的連結 ${value}`);
      el.setAttribute("href", value);
    } else if (key === "value" || key === "checked" || key === "disabled" || key === "open") el[key] = value;
    else el.setAttribute(key, value === true ? "" : String(value));
  }
}

/** 建立元素：h("button", { class: "add", on: { click } }, "加入") */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props && typeof props === "object" && !(props instanceof Node) && !Array.isArray(props)) apply(el, props);
  else append(el, props);
  append(el, children);
  return el;
}

/** 建立 SVG 元素。 */
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  append(el, children);
  return el;
}

/** 以新的子節點取代容器內容。 */
export function mount(container, ...children) {
  const fragment = document.createDocumentFragment();
  append(fragment, children);
  container.replaceChildren(fragment);
  return container;
}
