export default {
  id: "tech",
  zh: "技術與交付",
  en: "Tech & Delivery",
  intro: "成品是什麼形式、用什麼技術寫。交付形式決定了哪些 AI 工具做得出來。",
  groups: [
    {
      id: "delivery",
      zh: "交付形式",
      mode: "one",
      min: 1,
      max: 1
    },
    {
      id: "styling",
      zh: "樣式方案",
      mode: "one",
      min: 0,
      max: 1
    },
    {
      id: "extra",
      zh: "加值功能",
      mode: "many",
      min: 0,
      max: 5
    }
  ],
  modules: []
};
