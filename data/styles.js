// 內建的個人風格範例。使用者可以在介面上新增自己的風格，這裡的只是起點。
export default [
  {
    id: "builtin-ink",
    name: "白紙黑字加朱紅",
    fonts: { display: "Noto Serif TC（思源宋體）", body: "Noto Sans TC（思源黑體）" },
    colors: { bg: "#FFFFFF", surface: "#F4F4F2", fg: "#161616", muted: "#6B6B6B", accent: "#D4351C" },
    radius: "全站直角；只有頭像是正圓。",
    spacing: "所有間距為 8px 的倍數；區塊之間的垂直間距 96px。",
    signature: ["每個區塊標題的左側有一條 4px 寬的強調色直線", "分隔只用 1px 細線，不用色塊"],
    avoid: ["不使用陰影與漸層"],
    overrides: ["typography", "color", "shape"],
  },
  {
    id: "builtin-swatch",
    name: "色票型錄",
    fonts: { display: "Noto Sans TC 字重 900", body: "Noto Sans TC 字重 400" },
    colors: { bg: "#FFFFFF", fg: "#161616", muted: "#5C5C5C", accent: "#00A86B", pop: "#FF4D2E" },
    radius: "卡片 16px、按鈕全圓角、輸入框 8px。",
    spacing: "卡片之間 18px；區塊之間 72px。",
    signature: ["每個主要區塊用一個高飽和純色當底，色塊上的文字一律用接近黑色的深色", "卡片與輸入框有 2px 深色實線邊框，不加陰影", "區塊標題非常大且字重最重"],
    avoid: ["不使用漸層與半透明", "不使用細灰線與淡陰影的卡片"],
    overrides: ["typography", "color", "shape"],
  },
];
