// 使用者操作 → 狀態變更。所有規則都交給 engine 的純函式。
import { indexDomain, defaultRecipe } from "./engine/domain.js";
import { toggle, reorder, applyPreset } from "./engine/select.js";
import { randomRecipe } from "./engine/random.js";
import { sanitizeStyle, importData, decodeShare } from "./persist.js";

export function createActions(store, domain, { toast, confirm, builtinStyles = [] }) {
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

    rollDice() {
      const { recipe } = store.get();
      store.set({ recipe: randomRecipe(domain, recipe), manualText: null, rev: bump() });
      toast("已擲出一份隨機配方，簡述與個人風格保留不變");
    },

    /** 匯入匯出檔（已解析的 JSON）。回傳是否成功。 */
    importJson(json) {
      const result = importData(json, domain, builtinStyles, store.get().styles);
      if (!result) {
        toast("這不是配方圖鑑匯出的檔案，或檔案裡沒有網頁主題的配方");
        return false;
      }
      if (!confirm("匯入會取代目前的配方與專案簡述，自訂的個人風格會合併。要繼續嗎？")) return false;
      store.set({ recipe: result.recipe, styles: result.styles, manualText: null, rev: bump() });
      toast(result.dropped ? `已匯入配方，略過 ${result.dropped} 個無法辨識的項目` : "已匯入配方");
      return true;
    },

    /** 套用分享連結裡的選取；簡述、個人風格與「不明確時」設定維持不變。 */
    applyShare(text) {
      const shared = decodeShare(domain, text);
      if (!shared || !Object.keys(shared.picks).length) {
        toast("分享連結無法辨識，已略過");
        return;
      }
      const { recipe } = store.get();
      const hasWork = Object.keys(recipe.picks).some((id) => !domain.categories.find((c) => c.id === id)?.groups.every((g) => g.defaults));
      if (hasWork && !confirm("要用分享連結裡的配方取代你目前的選取嗎？專案簡述會保留。")) return;
      store.set({ recipe: { ...recipe, picks: shared.picks }, manualText: null, rev: bump() });
      toast(shared.dropped.length ? `已套用分享的配方，略過 ${shared.dropped.length} 個無法辨識的項目` : "已套用分享的配方");
    },
  };
}

export function currentStyle(state) {
  return state.styles.find((s) => s.id === state.recipe.styleId) ?? null;
}
