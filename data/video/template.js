// 動態影片主題的提示詞範本。預設交付單一 HTML 檔的動畫（固定時間軸、瀏覽器可播放），
// 輸出成影片檔列為進階選項。固定文字同樣受禁用字眼檢查。

const missing = (what) => `（未指定${what}：請依影片類型自行選擇最合適的做法，並在交付說明寫明你的選擇與理由。）`;

export default {
  id: "video",
  kind: "build",
  sections: [
    {
      id: "task",
      title: "任務",
      parts: [
        { kind: "text", requires: ["name"], text: "請製作一段可以在瀏覽器播放的動態影片：「{name}」。", else: "請製作一段可以在瀏覽器播放的動態影片。" },
        { kind: "text", requires: ["oneLiner"], text: "影片內容：{oneLiner}" },
        { kind: "fixed", format: "plain", lines: ["本文件是完整規格。請一次做完整支影片，不要只給分鏡表、片段或示意。"] },
        { kind: "unclear" },
        {
          kind: "fixed",
          format: "plain",
          lines: ["各項要求若互相牴觸，排在前面的優先：禁止事項、影片類型、規格、視覺風格、動態與轉場、個別分段。取捨的結果請一併列入「我的假設」。"],
        },
      ],
    },
    {
      id: "audience",
      title: "影片定位",
      parts: [
        { kind: "modules", category: "video-type", prefix: "影片類型", missing: missing("影片類型") },
        { kind: "brief", field: "audience", label: "觀眾" },
        { kind: "brief", field: "goal", label: "看完要記得的一件事" },
      ],
    },
    {
      id: "format",
      title: "規格",
      parts: [{ kind: "modules", category: "format", missing: missing("畫面比例或片長") }],
    },
    {
      id: "structure",
      title: "分段腳本",
      parts: [
        { kind: "modules", category: "structure", heading: "分段（依此順序播放）", format: "numbered", missing: missing("分段結構") },
        { kind: "brief", field: "content", label: "腳本、旁白與畫面文字素材" },
      ],
    },
    {
      id: "look",
      title: "視覺",
      parts: [{ kind: "modules", category: "look" }],
    },
    {
      id: "motion",
      title: "動態與轉場",
      parts: [{ kind: "modules", category: "motion" }],
    },
    {
      id: "sound",
      title: "聲音與字幕",
      parts: [{ kind: "modules", category: "sound" }],
    },
    {
      id: "tech",
      title: "技術與交付",
      parts: [
        { kind: "modules", category: "delivery", missing: missing("交付形式") },
        {
          kind: "fixed",
          lines: [
            "整支影片由同一條時間軸驅動：每個畫面只由播放時間決定，不依賴載入速度、捲動或隨機數，重新播放的結果完全相同。",
            "訪客設定減少動態（prefers-reduced-motion）時，改為依序淡入淡出的版本，總長度不變。",
            "交付方式：若你能在工作目錄建立檔案，請直接建立，完成後列出檔案清單與開啟方式；若不能，請以一個程式碼區塊輸出完整的 HTML 檔，並在區塊前一行標明檔名。不得省略任何部分，也不得以「其餘相同」帶過。",
          ],
        },
      ],
    },
    {
      id: "content",
      title: "畫面文字",
      parts: [
        { kind: "brief", field: "lang", label: "字幕與畫面文字語言" },
        {
          kind: "fixed",
          lines: ["依本規格寫出具體的畫面文字，不得使用 Lorem ipsum 或「標題文字」這類佔位字。數據、客戶名稱與見證若沒有提供，一律明確標示為「示意」。"],
        },
      ],
    },
    {
      id: "avoid",
      title: "禁止事項",
      parts: [{ kind: "modules", category: "anti-slop" }],
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
      "「分段腳本」列出的每一段都已實作，順序一致，沒有以註解或「待補」帶過的段落。",
      "從頭播放到結束的總長度符合「規格」的片長，誤差在 0.5 秒以內。",
      "重新整理後再播放一次，每個時間點的畫面都和第一次相同。",
      "瀏覽器主控台沒有錯誤訊息。",
      { text: "「禁止事項」中的每一項都沒有出現。", ifSection: "avoid" },
    ],
    acceptanceAssume: "交付內容的最後附有「我的假設」清單。",
  },
};
