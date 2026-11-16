// 快顯訊息，同時作為螢幕閱讀器的即時播報區。
import { h } from "./dom.js";

export function createToast(parent) {
  const el = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  parent.append(el);
  let timer;
  return (message) => {
    el.textContent = message;
    el.classList.add("is-on");
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("is-on"), 3200);
  };
}
