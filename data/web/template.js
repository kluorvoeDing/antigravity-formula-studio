// 網頁主題的提示詞範本。這裡的固定文字會原樣進入提示詞，同樣受禁用字眼檢查。

const missing = (what) => `（未指定${what}：請依定位自行選擇最合適的做法，並在交付說明寫明你的選擇與理由。）`;

export default {
  id: "web",
  kind: "build",
  sections: [
    {
      id: "task",
      title: "任務",
      parts: [
        { kind: "text", requires: ["name"], text: "請製作一個完整的網站：「{name}」。", else: "請製作一個完整的網站。" },
        { kind: "text", requires: ["oneLiner"], text: "一句話定位：{oneLiner}" },
        { kind: "fixed", format: "plain", lines: ["本文件是完整規格。請一次完成全部內容，不要只給大綱、片段或示意。"] },
        { kind: "unclear" },
      ],
    },
    {
      id: "audience",
      title: "定位與受眾",
      parts: [
        { kind: "modules", category: "site-type", prefix: "網站類型", missing: missing("網站類型") },
        { kind: "brief", field: "audience", label: "目標受眾" },
        { kind: "brief", field: "goal", label: "訪客該完成的事" },
      ],
    },
    {
      id: "structure",
      title: "頁面結構",
      parts: [
        { kind: "modules", category: "layout", heading: "整體版型" },
        { kind: "modules", category: "section", heading: "區塊（由上到下，依此順序）", format: "numbered", missing: missing("頁面區塊") },
        { kind: "modules", category: "component", heading: "元件與互動模式" },
      ],
    },
    {
      id: "visual",
      title: "視覺系統",
      parts: [
        { kind: "modules", category: "style", heading: "視覺風格" },
        { kind: "modules", category: "typography", heading: "字體排印" },
        { kind: "modules", category: "color", heading: "色彩" },
        { kind: "modules", category: "shape", heading: "間距與形狀" },
        { kind: "modules", category: "media", heading: "圖像與媒體" },
        { kind: "style", heading: "個人風格（與本段其他項目衝突時，以此為準）" },
      ],
    },
    {
      id: "motion",
      title: "動態與互動",
      parts: [{ kind: "modules", category: "motion" }],
    },
    {
      id: "tech",
      title: "技術與交付",
      parts: [
        { kind: "modules", category: "tech", missing: missing("交付形式") },
        {
          kind: "fixed",
          lines: [
            "交付方式：若你能在工作目錄建立檔案，請直接建立，完成後列出檔案清單與開啟方式；若不能，請逐一以程式碼區塊輸出每個檔案的完整內容，並在每個區塊的前一行標明檔案路徑。不得省略任何部分，也不得以「其餘相同」帶過。",
          ],
        },
        { kind: "modules", category: "quality", heading: "品質要求" },
      ],
    },
    {
      id: "content",
      title: "內容與文案",
      parts: [
        { kind: "brief", field: "lang", label: "介面與文案語言" },
        { kind: "modules", category: "voice", prefix: "語氣" },
        { kind: "brief", field: "content", label: "可使用的內容素材" },
        {
          kind: "fixed",
          lines: ["依本規格的定位寫出具體、可直接上線的文案；不得使用 Lorem ipsum 或「標題文字」這類佔位字。素材沒提供的事實（數字、客戶名稱、價格）請用合理的虛構內容，並在「我的假設」中註明。"],
        },
      ],
    },
    {
      id: "avoid",
      title: "禁止事項",
      parts: [{ kind: "modules", category: "anti-slop" }, { kind: "style-avoid" }],
    },
    {
      id: "extra",
      title: "補充說明",
      parts: [{ kind: "freetext", field: "extra" }],
    },
    {
      id: "acceptance",
      title: "驗收清單",
      parts: [
        { kind: "fixed", format: "plain", lines: ["交付前請逐項自我檢查，全部符合才算完成："] },
        { kind: "accept" },
      ],
    },
  ],
  fixed: {
    unclear: {
      assume: "規格沒寫到的地方，不要停下來發問；請自行做出合理的決定，並在交付時以「我的假設」為標題逐條列出。",
      ask: "開始之前，若有會影響整體方向的不明確之處，請先一次列出你的問題（最多 5 個）並等待回覆；其餘細節自行決定，並在交付時以「我的假設」為標題逐條列出。",
    },
    acceptance: [
      "「頁面結構」列出的每個區塊都已完整實作，順序一致，沒有以註解或「待補」帶過的部分。",
      "所有連結、按鈕與表單都有實際行為或明確的示範狀態，沒有點了沒反應的控制項。",
      "在寬度 375px、768px、1280px 下都沒有水平捲軸、文字重疊或被截斷的內容。",
      "瀏覽器主控台沒有錯誤訊息。",
      { text: "「禁止事項」中的每一項都沒有出現。", ifSection: "avoid" },
    ],
    acceptanceAssume: "交付內容的最後附有「我的假設」清單。",
  },
};
