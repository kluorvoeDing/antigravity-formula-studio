// 測試用的小型主題：涵蓋單選、複選上限、有序、衝突、相依、能力。
const mod = (id, extra = {}) => ({
  id,
  zh: `名稱-${id.split(".").pop()}`,
  en: `Name ${id.split(".").pop()}`,
  what: "測試用模組的一句話說明文字。",
  when: ["測試情境一"],
  avoid: ["測試情境二"],
  prompt: `做出 ${id.split(".").pop()}。`,
  tags: ["入門"],
  ...extra,
});

export function makeDomain() {
  return {
    id: "t",
    zh: "測試",
    en: "Test",
    steps: [
      { id: "start", zh: "起點", kind: "start" },
      { id: "kind", zh: "類型", categories: ["kind"] },
      { id: "parts", zh: "區塊", categories: ["part"] },
      { id: "look", zh: "外觀", categories: ["color", "tech"] },
    ],
    categories: [
      {
        id: "kind",
        zh: "類型",
        en: "Kind",
        intro: "測試類別。",
        groups: [{ id: "main", zh: "類型", mode: "one", min: 1, max: 1 }],
        modules: [mod("t.kind.a"), mod("t.kind.b")],
      },
      {
        id: "part",
        zh: "區塊",
        en: "Part",
        intro: "測試類別。",
        groups: [{ id: "main", zh: "區塊", mode: "many", min: 2, max: 3, ordered: true }],
        modules: [mod("t.part.p1", { accept: "p1 存在。" }), mod("t.part.p2"), mod("t.part.p3"), mod("t.part.p4")],
      },
      {
        id: "color",
        zh: "色彩",
        en: "Color",
        intro: "測試類別。",
        groups: [
          { id: "scheme", zh: "策略", mode: "one", min: 0, max: 1 },
          { id: "extra", zh: "細節", mode: "many", min: 0, max: 2, defaults: ["t.color.x1"] },
        ],
        modules: [
          mod("t.color.mono", { group: "scheme", conflicts: ["t.color.x2"] }),
          mod("t.color.duo", { group: "scheme" }),
          mod("t.color.x1", { group: "extra" }),
          mod("t.color.x2", { group: "extra" }),
        ],
      },
      {
        id: "tech",
        zh: "技術",
        en: "Tech",
        intro: "測試類別。",
        groups: [
          { id: "delivery", zh: "交付", mode: "one", min: 0, max: 1 },
          { id: "extra", zh: "加值", mode: "many", min: 0, max: 2 },
        ],
        modules: [
          mod("t.tech.single", { group: "delivery" }),
          mod("t.tech.server", { group: "delivery", needs: ["files", "shell"] }),
          mod("t.tech.form", { group: "extra", requires: [{ anyOf: ["t.tech.server"], why: "需要伺服器" }] }),
        ],
      },
    ],
    presets: [{ id: "basic", zh: "基本", what: "基本配方", picks: { kind: ["t.kind.a"], part: ["t.part.p2", "t.part.p1"] }, brief: { name: "預設名稱" } }],
    template: {
      id: "t",
      kind: "build",
      sections: [
        {
          id: "task",
          title: "任務",
          parts: [
            { kind: "text", requires: ["name"], text: "製作「{name}」。", else: "製作一個東西。" },
            { kind: "unclear" },
          ],
        },
        { id: "kind", title: "定位", parts: [{ kind: "modules", category: "kind", prefix: "類型", missing: "（未指定類型）" }] },
        { id: "parts", title: "結構", parts: [{ kind: "modules", category: "part", heading: "區塊", format: "numbered" }] },
        {
          id: "look",
          title: "外觀",
          parts: [{ kind: "modules", category: "color", heading: "色彩" }, { kind: "style", heading: "個人風格" }],
        },
        { id: "tech", title: "技術", parts: [{ kind: "modules", category: "tech" }, { kind: "fixed", lines: ["固定交付條款。"] }] },
        { id: "avoid", title: "禁止", parts: [{ kind: "style-avoid" }] },
        { id: "extra", title: "補充", parts: [{ kind: "freetext", field: "extra" }] },
        { id: "accept", title: "驗收", parts: [{ kind: "accept" }] },
      ],
      fixed: {
        unclear: { assume: "自行假設。", ask: "先發問。" },
        acceptance: ["沒有錯誤。"],
        acceptanceAssume: "附上假設清單。",
      },
    },
  };
}

export const style = {
  id: "mine",
  name: "我的風格",
  fonts: { display: "Noto Serif TC", body: "Noto Sans TC" },
  colors: { bg: "#FAF7F0", fg: "#1A1A1A", accent: "#C2410C" },
  radius: "全站 4px。",
  spacing: "以 8px 為單位。",
  signature: ["標題左側加一條 2px 直線"],
  avoid: ["不要使用漸層"],
  overrides: ["color"],
};
