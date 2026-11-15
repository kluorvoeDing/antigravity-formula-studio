export default {
  id: "motion",
  zh: "動態效果",
  en: "Motion",
  intro: "頁面上會動的部分：先決定整體強度，再挑幾個具體效果。",
  groups: [
    {
      id: "intensity",
      zh: "動態強度",
      mode: "one",
      min: 0,
      max: 1
    },
    {
      id: "effect",
      zh: "效果",
      mode: "many",
      min: 0,
      max: 4
    }
  ],
  modules: []
};
