// 左欄：固定順序的步驟與完成狀態。
import { h, mount } from "./dom.js";
import { stepStatus } from "../engine/check.js";
import { currentStyle } from "../state.js";

const STATUS = { done: "已完成", partial: "未選完", issue: "有衝突", empty: "" };

export function mountSteps(el, store, domain, actions) {
  function render(state) {
    const style = currentStyle(state);
    mount(
      el,
      h(
        "ol",
        {},
        domain.steps.map((step, i) => {
          const status = stepStatus(domain, state.recipe, step.id, style);
          const count = (step.categories ?? []).reduce((n, id) => n + (state.recipe.picks[id]?.length ?? 0), 0);
          const current = step.id === state.stepId;
          return h(
            "li",
            { class: ["step", `is-${status}`, current && "is-current"], data: { hue: i } },
            h(
              "a",
              {
                href: `#${domain.id}/${step.id}`,
                "aria-current": current && "step",
                on: {
                  click: (event) => {
                    event.preventDefault();
                    actions.goStep(step.id);
                  },
                },
              },
              h("span", { class: "step-no" }, String(i)),
              h("span", { class: "step-name" }, step.zh),
              count > 0 && h("span", { class: "step-count", "aria-label": `已選 ${count} 個` }, String(count)),
              h("span", { class: "step-hint" }, step.hint),
              STATUS[status] && h("span", { class: "step-status" }, STATUS[status]),
            ),
          );
        }),
      ),
    );
  }

  store.subscribe((state, prev) => {
    if (state.recipe !== prev.recipe || state.stepId !== prev.stepId || state.styles !== prev.styles) render(state);
  });
  render(store.get());
}
