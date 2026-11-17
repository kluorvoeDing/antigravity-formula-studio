import videoType from "./01-video-type.js";
import format from "./02-format.js";
import structure from "./03-structure.js";
import look from "./04-look.js";
import motion from "./05-motion.js";
import sound from "./06-sound.js";
import delivery from "./07-delivery.js";
import antiSlop from "./08-anti-slop.js";
import presets from "./presets.js";
import template from "./template.js";

export default {
  id: "video",
  zh: "動態影片",
  en: "Motion Video",
  tagline: "組出一支動態影片的完整規格，貼給任何 AI 都能做出可以在瀏覽器播放的成品。",
  brief: {
    title: "描述你的影片",
    intro: "全部選填。腳本與畫面文字越具體，做出來的影片越接近你要的。",
    unclear: true,
    fields: [
      { key: "name", label: "片名或產品名稱", placeholder: "例如：Tidepool 上線預告" },
      { key: "oneLiner", label: "一句話內容", placeholder: "例如：30 秒看懂三分鐘排好一週班表" },
      { key: "audience", label: "觀眾", hint: "誰會看、在哪裡看到（社群、官網、簡報）。", placeholder: "例如：在社群滑到的餐飲店長" },
      { key: "goal", label: "看完要記得的一件事", placeholder: "例如：排班不用再花一整個晚上" },
      { key: "content", label: "腳本、旁白與畫面文字素材", hint: "已經寫好的標語、數字、旁白稿，直接貼上來。", multiline: true, rows: 5 },
      { key: "extra", label: "補充說明", hint: "其他任何想交代的事。會原樣放進提示詞的「補充說明」。", multiline: true, rows: 3 },
      { key: "lang", label: "字幕與畫面文字語言" },
    ],
  },
  steps: [
    { id: "start", zh: "起點", hint: "挑一個現成配方，或直接描述你的影片", kind: "start" },
    { id: "type", zh: "類型", hint: "這是哪一種片", categories: ["video-type"] },
    { id: "format", zh: "規格", hint: "比例與片長", categories: ["format"] },
    { id: "structure", zh: "分段", hint: "由前到後有哪些段落", categories: ["structure"] },
    { id: "look", zh: "視覺", hint: "風格與配色", categories: ["look"] },
    { id: "motion", zh: "動態", hint: "怎麼動、怎麼接", categories: ["motion"] },
    { id: "sound", zh: "聲音", hint: "音樂、旁白與字幕", categories: ["sound"] },
    { id: "delivery", zh: "交付", hint: "成品形式與播放功能", categories: ["delivery"] },
    { id: "avoid", zh: "禁令", hint: "不准出現的東西", categories: ["anti-slop"] },
  ],
  categories: [videoType, format, structure, look, motion, sound, delivery, antiSlop],
  presets,
  template,
};
