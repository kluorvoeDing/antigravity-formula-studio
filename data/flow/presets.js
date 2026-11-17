// 現成配方：一組可直接使用的選取，附上英文鏡頭範例（只會填入還沒寫的欄位）。
const f = (category, ...slugs) => slugs.map((s) => `flow.${category}.${s}`);
const avoid = (...extra) => f("avoid", "text-overlays", "watermarks", ...extra);

export default [
  {
    id: "cinematic-short",
    zh: "電影感短片",
    what: "橫式三個鏡頭：中景、緩慢推軌、底片質感與黃金時刻光線，配環境音。",
    picks: {
      mode: f("mode", "text-to-video"),
      settings: f("settings", "landscape", "clip-8s"),
      shot: f("shot", "medium"),
      camera: f("camera", "dolly-in"),
      look: f("look", "cinematic-film", "golden-hour"),
      sound: f("sound", "ambient"),
      avoid: avoid(),
    },
    brief: {
      content:
        "She pours latte art into a white cup at the counter.\nShe slides the cup across the counter and smiles at a customer.\nShe looks out the window as the street outside slowly wakes up.",
      audience: "A woman in her 30s with short black hair, wearing a navy apron over a white shirt.",
      goal: "A small café at dawn with a warm wooden interior and a quiet street outside the window.",
    },
  },
  {
    id: "vertical-social",
    zh: "直式手持短片",
    what: "9:16 直式：特寫、手持鏡頭、紀錄片質感與陰天柔光，適合社群短影音。",
    picks: {
      mode: f("mode", "text-to-video"),
      settings: f("settings", "vertical", "clip-short"),
      shot: f("shot", "close-up"),
      camera: f("camera", "handheld"),
      look: f("look", "documentary", "overcast"),
      sound: f("sound", "ambient", "sfx"),
      avoid: avoid("extra-people"),
    },
    brief: {
      content: "Hands knead a ball of dough on a floured table.\nA tray of bread rolls goes into a hot oven.",
      goal: "A small home kitchen with a window and a wooden table.",
    },
  },
  {
    id: "consistent-character",
    zh: "角色一致的動畫",
    what: "用參考素材固定角色：3D 動畫、跟拍鏡頭，角色會開口說話並有配樂。",
    picks: {
      mode: f("mode", "ingredients"),
      settings: f("settings", "landscape", "clip-8s"),
      shot: f("shot", "medium"),
      camera: f("camera", "tracking"),
      look: f("look", "animated-3d"),
      sound: f("sound", "dialogue", "score"),
      avoid: avoid("distortion"),
    },
    brief: {
      content: "@fox walks through a snowy forest and stops at a frozen pond.\n@fox looks at its reflection and says: I finally found it.",
      audience: "@fox is a small orange fox with a green scarf, from the reference image.",
    },
  },
];
