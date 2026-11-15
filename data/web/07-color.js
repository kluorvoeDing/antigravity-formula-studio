export default {
  id: "color",
  zh: "色彩",
  en: "Color",
  intro: "用幾種顏色、怎麼分配，以及深色與淺色模式的處理。",
  groups: [
    {
      id: "scheme",
      zh: "色彩策略",
      mode: "one",
      min: 0,
      max: 1
    },
    {
      id: "mode",
      zh: "深淺色",
      mode: "one",
      min: 0,
      max: 1
    }
  ],
  modules: []
};
