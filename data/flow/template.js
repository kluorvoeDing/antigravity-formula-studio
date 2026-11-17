// Flow 主題的提示詞範本。輸出英文；每個鏡頭一段、可以單獨貼上。
// 段落順序依官方建議：景別與運鏡 → 主體與動作 → 場景 → 風格與光線 → 聲音。
// 介面上要手動選的設定（生成方式、比例、片長）另列一段中文說明，不進英文段落。

export default {
  id: "flow",
  kind: "shots",
  lang: "en",
  sections: [
    {
      id: "setup",
      title: "Flow 設定（在介面上選，不用貼）",
      parts: [
        { kind: "modules", category: "mode", lang: "zh" },
        { kind: "modules", category: "settings", lang: "zh" },
        {
          kind: "fixed",
          lines: ["下面每一段英文各生成一個片段：一次貼一段，不同鏡頭分開生成，再用 Scenebuilder 排成一整段。"],
        },
      ],
    },
    {
      id: "shots",
      title: "Shot prompts (one paragraph per clip)",
      parts: [
        {
          kind: "shots",
          label: "Shot",
          field: "content",
          fallback: "oneLiner",
          placeholder: "Describe the subject, the action and the setting of this shot here",
          before: ["shot", "camera"],
          lead: ["audience"],
          fields: ["goal"],
          categories: ["look", "sound"],
        },
      ],
    },
    {
      id: "negative",
      title: "Negative prompt",
      parts: [{ kind: "merged", label: "Exclude", categories: ["avoid"] }],
    },
    {
      id: "extra",
      title: "補充說明",
      parts: [{ kind: "freetext", field: "extra" }],
    },
  ],
  fixed: {
    unclear: { assume: "", ask: "" },
    acceptance: [],
  },
};
