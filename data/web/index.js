import siteType from "./01-site-type.js";
import layout from "./02-layout.js";
import section from "./03-section.js";
import component from "./04-component.js";
import style from "./05-style.js";
import typography from "./06-typography.js";
import color from "./07-color.js";
import shape from "./08-shape.js";
import motion from "./09-motion.js";
import media from "./10-media.js";
import tech from "./11-tech.js";
import quality from "./12-quality.js";
import voice from "./13-voice.js";
import antiSlop from "./14-anti-slop.js";
import presets from "./presets.js";
import template from "./template.js";

export default {
  id: "web",
  zh: "網頁生成",
  en: "Web",
  tagline: "組出一份完整的網站規格，貼給任何 AI 都能做出整站。",
  personalStyle: true,
  brief: {
    title: "描述你的網站",
    intro: "全部選填。寫得越具體，AI 產出的文案與內容越貼近你要的。",
    unclear: true,
    fields: [
      { key: "name", label: "網站或產品名稱", placeholder: "例如：Tidepool" },
      { key: "oneLiner", label: "一句話定位", placeholder: "例如：給小型團隊的排班工具，三分鐘排好一週班表" },
      { key: "audience", label: "目標受眾", hint: "誰會來看、他們在意什麼。", placeholder: "例如：10 到 50 人餐飲店的店長" },
      { key: "goal", label: "訪客該完成的事", hint: "看完之後你希望他們做什麼。", placeholder: "例如：註冊 14 天免費試用" },
      { key: "content", label: "可使用的內容素材", hint: "手邊已有的文字、數字、功能清單、客戶名稱，直接貼上來。", multiline: true, rows: 5 },
      { key: "extra", label: "補充說明", hint: "其他任何想交代的事。會原樣放進提示詞的「補充說明」。", multiline: true, rows: 3 },
      { key: "lang", label: "介面與文案語言" },
    ],
  },
  steps: [
    { id: "start", zh: "起點", hint: "挑一個現成配方，或直接描述你的網站", kind: "start" },
    { id: "type", zh: "類型", hint: "這是什麼網站", categories: ["site-type"] },
    { id: "layout", zh: "版型", hint: "頁面的骨架", categories: ["layout"] },
    { id: "sections", zh: "區塊", hint: "由上到下有哪些段落", categories: ["section"] },
    { id: "components", zh: "元件", hint: "會用到的互動零件", categories: ["component"] },
    { id: "style", zh: "風格", hint: "美學、字體、色彩與形狀", categories: ["style", "typography", "color", "shape"] },
    { id: "motion", zh: "動態", hint: "什麼會動、動多少", categories: ["motion"] },
    { id: "media", zh: "媒體", hint: "圖片、插畫與背景", categories: ["media"] },
    { id: "tech", zh: "技術", hint: "交付形式與品質要求", categories: ["tech", "quality"] },
    { id: "voice", zh: "文案與禁令", hint: "語氣，以及不准出現的東西", categories: ["voice", "anti-slop"] },
  ],
  categories: [siteType, layout, section, component, style, typography, color, shape, motion, media, tech, quality, voice, antiSlop],
  presets,
  template,
};
