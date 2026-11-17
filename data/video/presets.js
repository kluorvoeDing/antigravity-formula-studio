// 現成配方：一組可直接使用的選取，當作起點。
const v = (category, ...slugs) => slugs.map((s) => `video.${category}.${s}`);
const bans = (...extra) => v("anti-slop", "no-purple-gradient", "no-unreadable-text", ...extra);

export default [
  {
    id: "product-teaser",
    zh: "產品預告片",
    what: "30 秒橫式：鉤子、痛點、功能特寫、操作示範、結尾號召，乾淨的網格風格。",
    picks: {
      "video-type": v("video-type", "product-teaser"),
      format: v("format", "ratio-16-9", "length-30"),
      structure: v("structure", "hook-open", "problem-beat", "feature-beat", "ui-walkthrough", "end-card"),
      look: v("look", "swiss-grid", "mono-accent"),
      motion: v("motion", "expo-out", "hard-cut", "match-cut", "text-mask-reveal", "cursor-demo"),
      sound: v("sound", "music-cues"),
      delivery: v("delivery", "html-timeline", "playback-controls"),
      "anti-slop": bans("no-fabricated-data"),
    },
  },
  {
    id: "kinetic-social",
    zh: "直式動態文字短片",
    what: "15 秒直式：一句一句對拍跳出的大字，無聲也看得懂。",
    picks: {
      "video-type": v("video-type", "kinetic-typography"),
      format: v("format", "ratio-9-16", "length-15"),
      structure: v("structure", "hook-open", "feature-beat", "end-card"),
      look: v("look", "editorial-type", "high-contrast-duo"),
      motion: v("motion", "beat-sync", "hard-cut", "text-mask-reveal"),
      sound: v("sound", "silent-captions"),
      delivery: v("delivery", "html-timeline", "safe-area"),
      "anti-slop": bans("no-buzzwords"),
    },
  },
  {
    id: "data-story",
    zh: "數據動畫",
    what: "60 秒橫式：從問題到數字到結論，圖表一步步長出來，配旁白稿。",
    picks: {
      "video-type": v("video-type", "data-story"),
      format: v("format", "ratio-16-9", "length-60"),
      structure: v("structure", "title-card", "problem-beat", "stat-beat", "end-card"),
      look: v("look", "dark-tech", "mono-accent"),
      motion: v("motion", "expo-out", "wipe", "chart-build", "line-drawing"),
      sound: v("sound", "voiceover-script"),
      delivery: v("delivery", "html-timeline", "playback-controls", "seekable-timeline"),
      "anti-slop": bans("no-fabricated-data"),
    },
  },
  {
    id: "illustrated-story",
    zh: "插畫有聲故事",
    what: "60 秒橫式：分幕插畫加慢速視差推移，配旁白與字幕，適合有聲書片段。",
    picks: {
      "video-type": v("video-type", "illustrated-story"),
      format: v("format", "ratio-16-9", "length-60"),
      structure: v("structure", "title-card", "scene-sequence", "end-card"),
      look: v("look", "paper-collage", "warm-light"),
      motion: v("motion", "expo-out", "zoom-through", "parallax-layers"),
      sound: v("sound", "voiceover-script"),
      delivery: v("delivery", "html-timeline", "playback-controls"),
      "anti-slop": bans("no-gratuitous-shake"),
    },
  },
];
