import use from "./01-use.js";
import composition from "./02-composition.js";
import aspect from "./03-aspect.js";
import style from "./04-style.js";
import lighting from "./05-lighting.js";
import color from "./06-color.js";
import text from "./07-text.js";
import avoid from "./08-avoid.js";
import presets from "./presets.js";
import template from "./template.js";

export default {
  id: "image",
  zh: "圖片生成",
  en: "Image",
  tagline: "組出一份分行標籤的畫面規格，貼給任何能生成圖片的 AI。",
  // 合併成一行的短句，長度比網頁主題短
  limits: { prompt: [8, 90] },
  brief: {
    title: "描述你的圖片",
    intro: "「主體」最重要。其他欄位選填；寫進來的內容會原樣放進規格。",
    unclear: false,
    fields: [
      { key: "oneLiner", label: "主體", hint: "畫面主角是誰或是什麼、正在做什麼。", placeholder: "例如：一位穿深藍圍裙的店長，正在吧台後面拉花" },
      { key: "audience", label: "場景與背景", placeholder: "例如：清晨的小咖啡店，窗外是安靜的巷子" },
      { key: "goal", label: "想傳達的感覺", placeholder: "例如：一天開始前的安靜與專注" },
      { key: "content", label: "畫面文字（逐字）", hint: "要出現在圖上的字，會用引號原樣放進規格。不需要文字就留空。", placeholder: "例如：早安，第一杯" },
      { key: "lang", label: "畫面文字語言" },
      { key: "extra", label: "補充說明", hint: "其他想交代的事，例如參考圖要怎麼用。", multiline: true, rows: 3 },
    ],
  },
  steps: [
    { id: "start", zh: "起點", hint: "挑一個現成配方，或先寫主體", kind: "start" },
    { id: "use", zh: "用途", hint: "這張圖用在哪裡", categories: ["use"] },
    { id: "composition", zh: "構圖", hint: "景別、視角、比例", categories: ["composition", "aspect"] },
    { id: "style", zh: "風格", hint: "照片或插畫，什麼質感", categories: ["style"] },
    { id: "lighting", zh: "光線", hint: "光線與鏡頭", categories: ["lighting"] },
    { id: "color", zh: "色彩", hint: "色調與配色", categories: ["color"] },
    { id: "text", zh: "文字", hint: "圖上的字怎麼處理", categories: ["text"] },
    { id: "avoid", zh: "避免", hint: "明確排除的東西", categories: ["avoid"] },
  ],
  categories: [use, composition, aspect, style, lighting, color, text, avoid],
  presets,
  template,
};
