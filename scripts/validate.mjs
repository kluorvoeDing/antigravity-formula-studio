// 資料與原始碼檢查（零相依）。
// 用法：node scripts/validate.mjs [--allow-empty] [data/web/03-section.js ...]
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { TAGS, CAPABILITIES, PREVIEW_KINDS, WIRE_PRIMS, PREVIEW_FONTS, MOTION_NAMES, FRAME, LIMITS, BANNED, VAGUE } from "../data/schema.js";
import { FACETS } from "../data/facets.js";
import { sanitize } from "../js/engine/select.js";
import { check } from "../js/engine/check.js";
import { partCategories } from "../js/engine/assemble.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const len = (s) => [...s].length;
const ID_RE = /^[a-z]+\.[a-z-]+\.[a-z0-9]+(-[a-z0-9]+)*$/;
const HTML_RE = /<\/?[a-z][^>]*>/i;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function bannedIn(text) {
  const hits = [];
  for (const [kind, words] of Object.entries(BANNED)) {
    for (const word of words) {
      const found = /^[A-Za-z_]+$/.test(word) ? new RegExp(`(^|[^A-Za-z])${word}([^A-Za-z]|$)`, "i").test(text) : text.includes(word);
      if (found) hits.push(`${word}（${kind}）`);
    }
  }
  return hits;
}

function checkLen(errors, where, field, value, [min, max]) {
  const n = len(value);
  if (n < min || n > max) errors.push(`${where}：${field} 長度 ${n}，應在 ${min}–${max} 之間`);
}

function checkWireCell(errors, where, cell, state) {
  const t = typeof cell === "string" ? cell : cell?.t;
  if (!WIRE_PRIMS.includes(t)) return errors.push(`${where}：preview 不認得的基元 "${t}"`);
  if (typeof cell === "string") return;
  if (cell.hl) state.hl = true;
  if (cell.span !== undefined && !(Number.isInteger(cell.span) && cell.span >= 1 && cell.span <= 4)) {
    errors.push(`${where}：preview 的 span 必須是 1–4 的整數`);
  }
  if (t === "stack") {
    if (!Array.isArray(cell.items) || !cell.items.length) return errors.push(`${where}：stack 需要 items`);
    for (const item of cell.items) checkWireCell(errors, where, item, state);
  }
}

function checkPreview(errors, where, preview) {
  if (!preview || typeof preview !== "object") return errors.push(`${where}：preview 必須是物件`);
  if (!PREVIEW_KINDS.includes(preview.kind)) return errors.push(`${where}：preview.kind "${preview.kind}" 不存在`);
  if (preview.kind === "wire") {
    if (!["desktop", "mobile"].includes(preview.frame)) errors.push(`${where}：wire 的 frame 必須是 desktop 或 mobile`);
    if (!Array.isArray(preview.rows) || !preview.rows.length || preview.rows.length > 7) {
      return errors.push(`${where}：wire 需要 1–7 列 rows`);
    }
    const state = { hl: false };
    for (const row of preview.rows) {
      if (!Array.isArray(row) || !row.length || row.length > 4) {
        errors.push(`${where}：wire 的每一列需要 1–4 個基元`);
        continue;
      }
      for (const cell of row) checkWireCell(errors, where, cell, state);
    }
    if (!state.hl) errors.push(`${where}：wire 至少要有一個 hl:true 標出這個模組本身`);
  }
  const oneOf = (field, list) => {
    if (!list.includes(preview[field])) errors.push(`${where}：preview.${field} 必須是 ${list.join(" / ")} 之一`);
  };
  const text = (field, max, required = true) => {
    const value = preview[field];
    if (value === undefined && !required) return;
    if (typeof value !== "string" || !value || len(value) > max) errors.push(`${where}：preview.${field} 需為 1–${max} 字的字串`);
  };
  const color = (value, field) => {
    if (typeof value !== "string" || !COLOR_RE.test(value)) errors.push(`${where}：preview.${field} 必須是 #RRGGBB 色碼`);
  };
  const BORDERS = ["none", "hair", "thick"];
  const WEIGHTS = ["light", "regular", "bold", "black"];
  switch (preview.kind) {
    case "specimen":
      for (const field of ["bg", "fg", "accent"]) color(preview[field], field);
      if (preview.surface !== undefined) color(preview.surface, "surface");
      if (!(Number.isFinite(preview.radius) && preview.radius >= 0 && preview.radius <= 32)) errors.push(`${where}：preview.radius 需為 0–32`);
      oneOf("border", BORDERS);
      oneOf("shadow", ["none", "soft", "hard", "glow", "inset"]);
      oneOf("font", PREVIEW_FONTS);
      oneOf("weight", WEIGHTS);
      if (preview.effect !== undefined) oneOf("effect", ["glass", "grain", "grid", "gradient"]);
      break;
    case "type":
      oneOf("display", PREVIEW_FONTS);
      oneOf("body", PREVIEW_FONTS);
      oneOf("weight", WEIGHTS);
      oneOf("tracking", ["tight", "normal", "wide"]);
      oneOf("size", ["normal", "large", "huge"]);
      text("heading", 14);
      text("text", 26);
      break;
    case "palette":
      if (!Array.isArray(preview.colors) || preview.colors.length < 2 || preview.colors.length > 6) {
        errors.push(`${where}：palette 需要 2–6 個顏色`);
        break;
      }
      for (const c of preview.colors) {
        color(c?.hex, "colors.hex");
        if (typeof c?.name !== "string" || !c.name || len(c.name) > 8) errors.push(`${where}：palette 顏色需要 1–8 字的 name`);
        if (!(Number.isFinite(c?.share) && c.share > 0 && c.share <= 100)) errors.push(`${where}：palette 顏色的 share 需為 1–100`);
      }
      break;
    case "shape":
      if (!(Number.isFinite(preview.radius) && preview.radius >= 0 && preview.radius <= 32)) errors.push(`${where}：preview.radius 需為 0–32`);
      oneOf("border", BORDERS);
      oneOf("shadow", ["none", "soft", "layered", "hard"]);
      oneOf("gap", ["tight", "normal", "loose"]);
      break;
    case "motion":
      oneOf("name", MOTION_NAMES);
      break;
    case "frame":
      oneOf("ratio", FRAME.ratio);
      oneOf("shot", FRAME.shot);
      if (preview.place !== undefined) oneOf("place", FRAME.place);
      if (preview.text !== undefined) oneOf("text", FRAME.text);
      if (preview.grid !== undefined && typeof preview.grid !== "boolean") errors.push(`${where}：preview.grid 必須是 true 或 false`);
      break;
    case "tree":
      if (!Array.isArray(preview.lines) || !preview.lines.length || preview.lines.length > 9) errors.push(`${where}：tree 需要 1–9 行`);
      else for (const l of preview.lines) if (typeof l !== "string" || len(l) > 40) errors.push(`${where}：tree 每行需為 40 字以內的字串`);
      break;
    case "copy":
      text("headline", 22);
      text("body", 44, false);
      text("cta", 10, false);
      break;
    case "versus":
      text("dont", 30);
      text("do", 30);
      break;
    case "custom":
      text("name", 30);
      break;
  }
  const scan = (value) => {
    if (typeof value === "string") {
      if (/url\(|javascript:|expression\(/i.test(value)) errors.push(`${where}：preview 內不得有 url( 或 script`);
      if (value.startsWith("#") && !COLOR_RE.test(value)) errors.push(`${where}：preview 色碼 "${value}" 格式錯誤`);
    } else if (value && typeof value === "object") Object.values(value).forEach(scan);
  };
  scan(preview);
}

function checkModule(errors, module, category, domain, groupIds) {
  const where = module.id ?? `${category.id} 的某個模組`;
  const prefix = `${domain.id}.${category.id}.`;

  if (typeof module.id !== "string" || !ID_RE.test(module.id)) errors.push(`${where}：id 格式錯誤`);
  else if (!module.id.startsWith(prefix)) errors.push(`${where}：id 必須以 ${prefix} 開頭`);

  const english = domain.template?.lang === "en";
  for (const field of ["zh", "en", "what", english ? "promptEn" : "prompt"]) {
    if (typeof module[field] !== "string" || !module[field].trim()) errors.push(`${where}：缺少 ${field}`);
  }
  if (typeof module.promptEn === "string") {
    checkLen(errors, where, "promptEn", module.promptEn, domain.limits?.promptEn ?? [20, 320]);
    if (/[\u3000-\u9fff\uff00-\uffef]/.test(module.promptEn)) errors.push(`${where}：promptEn 只能用英文`);
  }
  if (typeof module.zh === "string") checkLen(errors, where, "zh", module.zh, LIMITS.zh);
  if (typeof module.en === "string") checkLen(errors, where, "en", module.en, LIMITS.en);
  if (typeof module.what === "string") {
    checkLen(errors, where, "what", module.what, LIMITS.what);
    for (const word of VAGUE) if (module.what.includes(word)) errors.push(`${where}：what 含空泛形容詞「${word}」`);
  }
  if (typeof module.prompt === "string") checkLen(errors, where, "prompt", module.prompt, domain.limits?.prompt ?? LIMITS.prompt);
  if (module.accept !== undefined) {
    if (typeof module.accept !== "string") errors.push(`${where}：accept 必須是字串`);
    else checkLen(errors, where, "accept", module.accept, LIMITS.accept);
  }
  if (module.note !== undefined) {
    if (typeof module.note !== "string") errors.push(`${where}：note 必須是字串`);
    else checkLen(errors, where, "note", module.note, LIMITS.note);
  }

  for (const field of ["when", "avoid"]) {
    const list = module[field];
    if (!Array.isArray(list) || list.length < 1 || list.length > 3) {
      errors.push(`${where}：${field} 需要 1–3 條`);
      continue;
    }
    for (const item of list) {
      if (typeof item !== "string") errors.push(`${where}：${field} 的項目必須是字串`);
      else checkLen(errors, where, `${field} 項目`, item, LIMITS.whenItem);
    }
  }

  if (!Array.isArray(module.tags) || !module.tags.length || module.tags.length > 5) errors.push(`${where}：tags 需要 1–5 個`);
  else for (const tag of module.tags) if (!TAGS.includes(tag)) errors.push(`${where}：tag「${tag}」不在詞表內`);

  if (module.group !== undefined && !groupIds.has(module.group)) errors.push(`${where}：group "${module.group}" 不存在於 ${category.id}`);
  for (const cap of module.needs ?? []) if (!CAPABILITIES.includes(cap)) errors.push(`${where}：needs "${cap}" 不存在`);
  if (module.preview !== undefined) checkPreview(errors, where, module.preview);
  if (module.sets !== undefined) {
    if (!module.sets || typeof module.sets !== "object" || Array.isArray(module.sets)) errors.push(`${where}：sets 必須是物件`);
    else
      for (const [facet, value] of Object.entries(module.sets)) {
        if (!FACETS[facet]) errors.push(`${where}：sets 的面向 "${facet}" 不存在（見 data/facets.js）`);
        else if (!FACETS[facet].values[value]) errors.push(`${where}：sets.${facet} 的值 "${value}" 不存在`);
      }
  }

  for (const field of ["prompt", "promptEn", "accept"]) {
    if (typeof module[field] !== "string") continue;
    for (const hit of bannedIn(module[field])) errors.push(`${where}：${field} 含禁用字眼 ${hit}`);
  }
  const scanHtml = (value) => {
    if (typeof value === "string") {
      if (HTML_RE.test(value)) errors.push(`${where}：字串中不得含 HTML 標籤`);
    } else if (value && typeof value === "object") Object.values(value).forEach(scanHtml);
  };
  scanHtml(module.preview?.kind === "tree" ? { ...module, preview: undefined } : module);
}

/** 檢查一個主題的全部資料。回傳 { errors, warnings, count }。 */
export function validateDomain(domain, { allowEmpty = false } = {}) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const categoryIds = new Set();

  for (const category of domain.categories) {
    if (categoryIds.has(category.id)) errors.push(`類別 id 重複：${category.id}`);
    categoryIds.add(category.id);
    for (const field of ["id", "zh", "en", "intro"]) {
      if (typeof category[field] !== "string" || !category[field]) errors.push(`類別 ${category.id}：缺少 ${field}`);
    }
    if (typeof category.intro === "string") checkLen(errors, `類別 ${category.id}`, "intro", category.intro, LIMITS.intro);
    if (!Array.isArray(category.groups) || !category.groups.length) {
      errors.push(`類別 ${category.id}：至少需要一個分組`);
      continue;
    }
    const groupIds = new Set();
    for (const group of category.groups) {
      if (groupIds.has(group.id)) errors.push(`類別 ${category.id}：分組 id 重複 ${group.id}`);
      groupIds.add(group.id);
      if (!["one", "many"].includes(group.mode)) errors.push(`${category.id}.${group.id}：mode 必須是 one 或 many`);
      if (!(Number.isInteger(group.min) && Number.isInteger(group.max) && group.min >= 0 && group.max >= Math.max(1, group.min))) {
        errors.push(`${category.id}.${group.id}：min / max 不合理`);
      }
      if (group.mode === "one" && group.max !== 1) errors.push(`${category.id}.${group.id}：單選組的 max 必須是 1`);
    }
    if (!category.modules.length) {
      (allowEmpty ? warnings : errors).push(`類別 ${category.id}：還沒有任何模組`);
    }
    for (const module of category.modules) {
      if (ids.has(module.id)) errors.push(`模組 id 重複：${module.id}`);
      ids.add(module.id);
      checkModule(errors, module, category, domain, groupIds);
    }
    for (const group of category.groups) {
      const members = category.modules.filter((m) => (m.group ?? category.groups[0].id) === group.id);
      if (category.modules.length && members.length < Math.max(group.min, 1)) {
        (allowEmpty ? warnings : errors).push(`${category.id}.${group.id}：模組數 ${members.length} 少於所需`);
      }
      for (const id of group.defaults ?? []) {
        if (!members.some((m) => m.id === id)) errors.push(`${category.id}.${group.id}：defaults 的 ${id} 不屬於此分組`);
      }
      if ((group.defaults ?? []).length > (group.mode === "one" ? 1 : group.max)) errors.push(`${category.id}.${group.id}：defaults 超過上限`);
    }
  }

  for (const category of domain.categories) {
    for (const module of category.modules) {
      const refs = [
        ...(module.related ?? []).map((id) => ["related", id]),
        ...(module.conflicts ?? []).map((id) => ["conflicts", id]),
        ...(module.requires ?? []).flatMap((r) => (r.anyOf ?? []).map((id) => ["requires", id])),
      ];
      for (const [field, id] of refs) {
        if (!ids.has(id)) errors.push(`${module.id}：${field} 指向不存在的 ${id}`);
        if (id === module.id) errors.push(`${module.id}：${field} 不得指向自己`);
      }
      for (const rule of module.requires ?? []) {
        if (!Array.isArray(rule.anyOf) || !rule.anyOf.length || typeof rule.why !== "string") errors.push(`${module.id}：requires 需要 anyOf 與 why`);
      }
    }
  }

  for (const step of domain.steps) {
    for (const id of step.categories ?? []) if (!categoryIds.has(id)) errors.push(`步驟 ${step.id}：類別 ${id} 不存在`);
  }
  const inSteps = new Set(domain.steps.flatMap((s) => s.categories ?? []));
  for (const id of categoryIds) if (!inSteps.has(id)) errors.push(`類別 ${id} 沒有出現在任何步驟`);

  const template = domain.template;
  for (const section of template.sections) {
    for (const part of section.parts) {
      for (const id of partCategories(part)) if (!categoryIds.has(id)) errors.push(`範本 ${section.id}：類別 ${id} 不存在`);
    }
  }
  const usedInTemplate = new Set(template.sections.flatMap((s) => s.parts.flatMap(partCategories)));
  for (const id of categoryIds) if (!usedInTemplate.has(id)) errors.push(`類別 ${id} 沒有出現在範本中`);
  const templateText = [];
  const collect = (value) => {
    if (typeof value === "string") templateText.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(template);
  for (const text of templateText) for (const hit of bannedIn(text)) errors.push(`範本固定文字含禁用字眼 ${hit}：「${text.slice(0, 24)}…」`);

  const presetIds = new Set();
  for (const preset of domain.presets ?? []) {
    if (presetIds.has(preset.id)) errors.push(`配方 id 重複：${preset.id}`);
    presetIds.add(preset.id);
    const { dropped, recipe } = sanitize(domain, { picks: preset.picks });
    if (dropped.length) errors.push(`配方 ${preset.id}：含不合法的選取 ${dropped.join("、")}`);
    for (const issue of check(domain, recipe)) {
      if (issue.level === "warn") errors.push(`配方 ${preset.id}：${issue.msg}`);
      else if (!allowEmpty) errors.push(`配方 ${preset.id}：${issue.msg}`);
    }
  }

  return { errors, warnings, count: ids.size };
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "output") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

/** 掃描原始碼：禁用會造成注入的 DOM API，以及 iCloud 產生的衝突副本。 */
export async function validateSource(root = ROOT) {
  const errors = [];
  const files = await walk(root);
  const forbidden = /\.(innerHTML|outerHTML)\s*[+]?=|insertAdjacentHTML|document\.write\(/;
  for (const file of files) {
    const rel = path.relative(root, file);
    if (/ \d+\.[a-z]+$/i.test(rel) && /^(data|js|css|scripts|tests)\//.test(rel)) errors.push(`疑似 iCloud 衝突副本：${rel}`);
    if (rel.startsWith("js/") && rel.endsWith(".js")) {
      const text = await readFile(file, "utf8");
      text.split("\n").forEach((line, i) => {
        if (forbidden.test(line)) errors.push(`${rel}:${i + 1} 使用了禁用的 DOM API`);
      });
    }
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const allowEmpty = args.includes("--allow-empty");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => path.resolve(a));
  const { default: registry } = await import("../data/registry.js");
  let failed = false;

  for (const [id, load] of Object.entries(registry)) {
    const domain = (await load()).default;
    let { errors, warnings, count } = validateDomain(domain, { allowEmpty: allowEmpty || only.length > 0 });
    if (only.length) {
      const wanted = new Set();
      for (const file of only) {
        const mod = (await import(pathToFileURL(file).href)).default;
        if (mod?.id) wanted.add(`${domain.id}.${mod.id}.`).add(`類別 ${mod.id}`).add(`${mod.id}.`);
      }
      const keep = (msg) => [...wanted].some((key) => msg.startsWith(key));
      errors = errors.filter(keep);
      warnings = warnings.filter(keep);
    }
    console.log(`[${id}] ${count} 個模組，${errors.length} 個錯誤，${warnings.length} 個提醒`);
    for (const msg of warnings) console.log(`  提醒 ${msg}`);
    for (const msg of errors) console.log(`  錯誤 ${msg}`);
    if (errors.length) failed = true;
  }

  if (!only.length) {
    const sourceErrors = await validateSource();
    for (const msg of sourceErrors) console.log(`  錯誤 ${msg}`);
    if (sourceErrors.length) failed = true;
  }
  console.log(failed ? "檢查未通過" : "檢查通過");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
