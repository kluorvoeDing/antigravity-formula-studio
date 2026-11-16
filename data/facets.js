// 「面向」：會影響整站的設計屬性。模組用 sets 宣告自己對某個面向的要求，
// 兩個已選模組對同一個面向要求不同時，檢查會提醒使用者（不靠 AI，也不需連網）。
export const FACETS = {
  shadow: { zh: "陰影", values: { none: "不用陰影", soft: "柔和陰影", hard: "不模糊的硬邊陰影" } },
  radius: { zh: "圓角", values: { sharp: "直角", rounded: "圓角", pill: "全圓角" } },
  gradient: { zh: "漸層", values: { none: "不用漸層", used: "使用漸層" } },
  theme: { zh: "深淺色", values: { light: "淺色", dark: "深色" } },
};
