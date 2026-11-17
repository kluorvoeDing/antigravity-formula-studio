import mode from "./01-mode.js";
import settings from "./02-settings.js";
import shot from "./03-shot.js";
import camera from "./04-camera.js";
import look from "./05-look.js";
import sound from "./06-sound.js";
import avoid from "./07-avoid.js";
import presets from "./presets.js";
import template from "./template.js";

export default {
  id: "flow",
  zh: "Flow 影片",
  en: "Flow Video",
  tagline: "把每個鏡頭組成一段英文提示詞，一次貼一段到 Google Flow 生成片段。",
  limits: { promptEn: [8, 240] },
  brief: {
    title: "描述你的鏡頭",
    intro: "影片模型對英文的範例最多，建議這裡也用英文寫；寫中文也會原樣放進提示詞。",
    unclear: false,
    fields: [
      {
        key: "content",
        label: "鏡頭清單（每行一個鏡頭）",
        hint: "每行寫一個鏡頭的主體、動作與場景，例如 A barista pours latte art at a quiet café counter。",
        multiline: true,
        rows: 6,
      },
      { key: "audience", label: "角色描述（每個鏡頭都會帶入）", hint: "外貌、年齡、服裝寫完整，每段都重複，角色才會一致。", placeholder: "例如：a woman in her 30s with short black hair and a navy apron" },
      { key: "goal", label: "共同場景（每個鏡頭都會帶入）", placeholder: "例如：a small café at dawn, quiet street outside the window" },
      { key: "oneLiner", label: "一句話故事", hint: "沒有寫鏡頭清單時，這一句會當成唯一一個鏡頭。" },
      { key: "extra", label: "補充說明", hint: "給自己的備註，會列在最後的「補充說明」。", multiline: true, rows: 3 },
    ],
  },
  steps: [
    { id: "start", zh: "起點", hint: "寫鏡頭清單，或挑一個現成配方", kind: "start" },
    { id: "mode", zh: "方式", hint: "在介面上選哪一種生成", categories: ["mode"] },
    { id: "settings", zh: "規格", hint: "比例與片長", categories: ["settings"] },
    { id: "shot", zh: "景別", hint: "多遠、什麼角度", categories: ["shot"] },
    { id: "camera", zh: "運鏡", hint: "攝影機怎麼動", categories: ["camera"] },
    { id: "look", zh: "風格", hint: "質感與光線", categories: ["look"] },
    { id: "sound", zh: "聲音", hint: "環境音、對白、配樂", categories: ["sound"] },
    { id: "avoid", zh: "排除", hint: "不想出現的東西", categories: ["avoid"] },
  ],
  categories: [mode, settings, shot, camera, look, sound, avoid],
  presets,
  template,
};
