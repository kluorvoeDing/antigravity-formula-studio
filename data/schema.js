// 資料契約：所有資料檔、驗證腳本與引擎共用的型別與常數。

/**
 * @typedef {"files"|"shell"|"network"} Capability
 *
 * @typedef {Object} Module
 * @property {string} id         "<domain>.<category>.<slug>"，小寫 kebab，發布後不改名
 * @property {string} zh         中文名
 * @property {string} en         英文術語（Title Case）
 * @property {string[]} [aka]    別名，供搜尋
 * @property {string} what       一句話：使用者會看到什麼
 * @property {string[]} when     何時用（1–3 條具體情境）
 * @property {string[]} avoid    何時別用（1–3 條具體情境）
 * @property {string} prompt     寫進提示詞的完整指示句；引擎會自動加「zh（en）：」前綴
 * @property {string} [accept]   一句可檢查的驗收條件
 * @property {string} [group]    類內分組 id；省略則屬於該類第一組
 * @property {string[]} tags     只能用 TAGS 內的詞
 * @property {string[]} [related]
 * @property {string[]} [conflicts]  載入時自動補成雙向
 * @property {{anyOf: string[], why: string}[]} [requires]
 * @property {Capability[]} [needs]  執行這個選項的 agent 需要的能力（只顯示在介面）
 * @property {string} [note]     不進提示詞的操作提醒
 * @property {Object} [preview]  宣告式預覽規格
 *
 * @typedef {Object} Group
 * @property {string} id
 * @property {string} zh
 * @property {"one"|"many"} mode
 * @property {number} min
 * @property {number} max
 * @property {boolean} [ordered]   選取順序有意義（例如頁面區塊）
 * @property {string[]} [defaults] 新配方預選的模組 id
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} zh
 * @property {string} en
 * @property {string} intro
 * @property {Group[]} groups
 * @property {Module[]} modules
 *
 * @typedef {Object} Brief
 * @property {string} name
 * @property {string} oneLiner
 * @property {string} audience
 * @property {string} goal
 * @property {string} content
 * @property {string} extra
 * @property {string} lang
 *
 * @typedef {Object} Recipe
 * @property {1} v
 * @property {string} domain
 * @property {Brief} brief
 * @property {Record<string, string[]>} picks  categoryId → moduleId[]
 * @property {string|null} styleId
 * @property {"assume"|"ask"} onUnclear
 *
 * @typedef {Object} Style  個人風格
 * @property {string} id
 * @property {string} name
 * @property {{display: string, body: string, mono?: string}} fonts
 * @property {{bg: string, fg: string, accent: string, pop?: string, surface?: string, muted?: string}} colors
 * @property {string} radius
 * @property {string} spacing
 * @property {string[]} signature
 * @property {string[]} avoid
 * @property {string[]} overrides  接管的類別 id（typography / color / shape）
 */

export const CAPABILITIES = ["files", "shell", "network"];

export const DEFAULT_LANG = "繁體中文（台灣用語）";

export const BRIEF_FIELDS = ["name", "oneLiner", "audience", "goal", "content", "extra", "lang"];

export const BRIEF_MAX = { name: 80, oneLiner: 200, audience: 300, goal: 300, content: 4000, extra: 2000, lang: 60 };

export const TAGS = [
  "導覽", "主視覺", "信任", "轉換", "內容", "展示", "社群證明", "定價", "表單", "資料", "頁尾", "敘事",
  "電商", "文件", "作品集", "工具", "行銷", "編輯",
  "極簡", "大膽", "復古", "科技", "溫暖", "專業", "活潑", "奢華", "深色", "淺色",
  "捲動", "懸停", "載入", "轉場", "微互動",
  "文字", "圖片", "影片", "插畫", "3D", "圖示", "背景",
  "響應式", "無障礙", "效能", "SEO", "單檔", "框架", "樣式", "部署",
  "中文", "入門", "進階", "版面", "回饋", "輸入", "浮層", "排序篩選",
  // 影片、圖片與 Flow
  "構圖", "鏡頭", "運鏡", "光線", "材質", "攝影", "節奏", "聲音", "字幕", "後製", "敘事結構", "規格", "一致性",
];

export const PREVIEW_KINDS = ["wire", "specimen", "type", "palette", "shape", "motion", "tree", "copy", "versus", "frame", "custom"];

// frame 預覽：畫面比例、景別與主體位置（靜態），供圖片、影片與 Flow 使用
export const FRAME = {
  ratio: ["16:9", "9:16", "1:1", "4:5", "3:2", "2:3", "21:9"],
  shot: ["extreme-wide", "wide", "full", "medium", "close", "extreme-close", "object", "objects"],
  place: ["center", "left", "right", "low", "high"],
  text: ["none", "top", "bottom", "left"],
};

// wire 預覽可用的線框基元
export const WIRE_PRIMS = [
  "nav", "h1", "h2", "p", "btn", "btns", "link", "img", "video", "card", "cards3", "cards4",
  "logos", "quote", "avatar", "stat", "stats3", "table", "form", "input", "list", "accordion",
  "tabs", "footer", "chip", "chips", "divider", "sidebar", "space", "price3", "cols4", "stack", "progress", "badge", "toggle",
];

// 預覽可用的字體角色（對應系統字體堆疊，不為預覽載入外部字體）
export const PREVIEW_FONTS = ["sans", "serif", "mono", "round", "kai", "condensed"];

// motion 預覽可用的具名動畫
export const MOTION_NAMES = [
  "none", "subtle", "expressive", "fade-up", "hover-lift", "marquee",
  "parallax", "sticky-scroll", "scroll-progress", "page-load-stagger", "text-reveal", "view-transitions", "magnetic-button",
  "tilt-3d", "cursor-follower", "count-up", "button-press", "smooth-scroll", "image-hover-zoom", "svg-line-drawing",
];

export const LIMITS = {
  zh: [2, 14],
  en: [2, 40],
  what: [12, 70],
  whenItem: [6, 44],
  prompt: [30, 200],
  accept: [10, 90],
  note: [6, 120],
  intro: [10, 120],
};

// 提示詞內容（prompt / accept / 範本固定文字）不得出現的字眼
export const BANNED = {
  agent: ["Claude", "ChatGPT", "GPT", "Codex", "Antigravity", "Gemini", "Copilot", "Artifact"],
  reference: ["上述", "前述", "剛才", "上一則", "附件", "這個對話", "如上"],
  repo: ["showreel.html", "render_video", "generate_audio", "SciPy"],
};

// what 欄位不得使用的空泛形容詞
export const VAGUE = ["極致", "高級感", "次世代", "靈動", "頂級", "絕美", "完美", "震撼", "驚豔"];
