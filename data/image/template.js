// 圖片主題的提示詞範本。不是開發任務：輸出一份分行標籤的畫面規格，
// 同一個標籤底下的模組合成一行（官方指南建議用「主體、細節、限制」這類標籤分段）。

export default {
  id: "image",
  kind: "labels",
  sections: [
    {
      id: "spec",
      title: "圖片規格",
      parts: [
        { kind: "fixed", format: "plain", lines: ["請依下列規格直接生成一張圖片，不需要先確認或提問。"] },
        { kind: "merged", label: "用途", categories: ["use"] },
        {
          kind: "text",
          requires: ["oneLiner"],
          text: "主體：{oneLiner}",
          else: "主體：請依用途設計一個具體的主體（是誰或是什麼、正在做什麼），並在回覆中用一句話說明你的選擇（不要寫進圖裡）。",
        },
        { kind: "text", requires: ["audience"], text: "場景與背景：{audience}" },
        { kind: "text", requires: ["goal"], text: "想傳達的感覺：{goal}" },
        { kind: "merged", label: "構圖", categories: ["composition"] },
        { kind: "merged", label: "比例", categories: ["aspect"] },
        { kind: "merged", label: "風格與媒材", categories: ["style"] },
        { kind: "merged", label: "光線與鏡頭", categories: ["lighting"] },
        { kind: "merged", label: "色彩", categories: ["color"] },
        { kind: "merged", label: "畫面文字", field: "content", quote: true, categories: ["text"] },
        { kind: "text", requires: ["content"], text: "畫面文字語言：{lang}；文字只出現一次，逐字照抄，不要增減或改寫。" },
        { kind: "merged", label: "避免", categories: ["avoid"] },
      ],
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
