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
