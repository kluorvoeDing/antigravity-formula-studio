// 使用者操作 → 狀態變更。所有規則都交給 engine 的純函式。
import { indexDomain, defaultRecipe } from "./engine/domain.js";
import { toggle, reorder, applyPreset } from "./engine/select.js";
import { sanitizeStyle } from "./persist.js";

export function createActions(store, domain, { toast, confirm }) {
  const ix = indexDomain(domain);
  const name = (id) => ix.modules.get(id)?.module.zh ?? id;
  const setRecipe = (recipe) => store.set({ recipe });
  const bump = () => store.get().rev + 1;

  return {
    goStep(stepId) {
      if (domain.steps.some((s) => s.id === stepId)) store.set({ stepId, query: "" });
    },

    toggleModule(moduleId) {
      const { recipe } = store.get();
      let result = toggle(domain, recipe, moduleId);
      if (result.reason === "conflict") {
        const others = result.blocked.map((id) => `「${name(id)}」`).join("、");
        if (!confirm(`「${name(moduleId)}」與已選的${others}互相衝突。\n要改選「${name(moduleId)}」並移除${others}嗎？`)) return;
        result = toggle(domain, recipe, moduleId, { force: true });
      }
      if (result.reason === "max") {
        const { category, group } = ix.modules.get(moduleId);
        toast(`「${category.groups.length > 1 ? group.zh : category.zh}」最多選 ${group.max} 個，請先移除一個`);
        return;
      }
      if (result.reason === "unknown") return;
      setRecipe(result.recipe);
      const picked = result.recipe.picks[ix.modules.get(moduleId).category.id]?.includes(moduleId);
      if (result.replaced.length) toast(`已改選「${name(moduleId)}」，取代${result.replaced.map((id) => `「${name(id)}」`).join("、")}`);
      else toast(picked ? `已加入「${name(moduleId)}」` : `已移除「${name(moduleId)}」`);
    },

    movePick(categoryId, from, to) {
      setRecipe(reorder(store.get().recipe, categoryId, from, to));
    },

    usePreset(presetId) {
      const preset = domain.presets.find((p) => p.id === presetId);
      if (!preset) return;
      store.set({ recipe: applyPreset(domain, store.get().recipe, presetId), rev: bump() });
      toast(`已套用配方「${preset.zh}」`);
    },

    setBrief(field, value) {
      const { recipe } = store.get();
      setRecipe({ ...recipe, brief: { ...recipe.brief, [field]: value } });
    },

    setUnclear(value) {
      setRecipe({ ...store.get().recipe, onUnclear: value === "ask" ? "ask" : "assume" });
    },

    resetRecipe() {
      if (!confirm("要清空目前的配方與專案簡述嗎？這個動作無法復原。")) return;
      store.set({ recipe: defaultRecipe(domain), manualText: null, rev: bump() });
      toast("已清空配方");
    },

    chooseStyle(styleId) {
      const { recipe, styles } = store.get();
      setRecipe({ ...recipe, styleId: styles.some((s) => s.id === styleId) ? styleId : null });
    },

    saveStyle(input) {
      const style = sanitizeStyle(input);
      if (!style) return null;
      const { styles, recipe } = store.get();
      const exists = styles.some((s) => s.id === style.id);
      store.set({
        styles: exists ? styles.map((s) => (s.id === style.id ? style : s)) : [...styles, style],
        recipe: { ...recipe, styleId: style.id },
      });
      toast(`已儲存個人風格「${style.name}」`);
      return style;
    },

    deleteStyle(styleId) {
      const { styles, recipe } = store.get();
      const style = styles.find((s) => s.id === styleId);
      if (!style || !confirm(`要刪除個人風格「${style.name}」嗎？`)) return;
      store.set({
        styles: styles.filter((s) => s.id !== styleId),
        recipe: recipe.styleId === styleId ? { ...recipe, styleId: null } : recipe,
      });
      toast(`已刪除「${style.name}」`);
    },

    setManual(text) {
      store.set({ manualText: text });
    },
  };
}

export function currentStyle(state) {
  return state.styles.find((s) => s.id === state.recipe.styleId) ?? null;
}
