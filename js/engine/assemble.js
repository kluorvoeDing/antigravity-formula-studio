// 配方 → 提示詞。純函式；範本的結構與固定文字都在 data/<domain>/template.js。
import { indexDomain, orderedPicks } from "./domain.js";

function fill(text, brief) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (brief[key] ?? "").trim());
}

function moduleLine(module, prefix) {
  const name = `${module.zh}（${module.en}）`;
  return prefix ? `${prefix}：${name}——${module.prompt}` : `${name}：${module.prompt}`;
}

function styleLines(style) {
  if (!style) return [];
  const lines = [];
  const { fonts = {}, colors = {} } = style;
  const fontParts = [
    fonts.display && `標題用 ${fonts.display}`,
    fonts.body && `內文用 ${fonts.body}`,
    fonts.mono && `等寬字用 ${fonts.mono}`,
  ].filter(Boolean);
  if (fontParts.length) lines.push(`字體：${fontParts.join("；")}。`);

  const colorNames = { bg: "背景", surface: "卡片與區塊底色", fg: "主要文字", muted: "次要文字", accent: "強調色", pop: "點綴色" };
  const colorParts = Object.entries(colorNames)
    .filter(([key]) => colors[key])
    .map(([key, label]) => `${label} ${colors[key]}`);
  if (colorParts.length) lines.push(`色票（請原樣使用這些色碼）：${colorParts.join("、")}。`);

  if (style.radius) lines.push(`圓角：${style.radius}`);
  if (style.spacing) lines.push(`間距：${style.spacing}`);
  for (const item of style.signature ?? []) lines.push(`招牌手法：${item}`);
  return lines;
}

/** 把一個範本零件展開成若干行。 */
function renderPart(part, ctx) {
  const { ix, recipe, style, template } = ctx;
  const brief = recipe.brief;
  const overridden = new Set(style?.overrides ?? []);

  switch (part.kind) {
    case "text": {
      const ready = (part.requires ?? []).every((field) => (brief[field] ?? "").trim());
      const text = ready ? part.text : part.else;
      return text ? [{ text: fill(text, brief), format: "plain" }] : [];
    }
    case "unclear":
      return [{ text: template.fixed.unclear[recipe.onUnclear] ?? template.fixed.unclear.assume, format: "plain" }];
    case "brief": {
      const value = (brief[part.field] ?? "").trim();
      return value ? [{ text: `${part.label}：${value}`, format: "bullets" }] : [];
    }
    case "freetext": {
      const value = (brief[part.field] ?? "").trim();
      return value ? [{ text: value, format: "plain" }] : [];
    }
    case "fixed":
      return part.lines.map((text) => ({ text, format: part.format ?? "bullets" }));
    case "modules": {
      if (overridden.has(part.category)) return [];
      const entries = orderedPicks(ix, recipe, part.category);
      const format = part.format ?? "bullets";
      const lines = entries.map(({ module }) => ({ text: moduleLine(module, part.prefix), format, moduleId: module.id }));
      if (!entries.length && part.missing) {
        const category = ix.categories.get(part.category);
        if (category?.groups.some((g) => g.min > 0)) lines.push({ text: part.missing, format: "bullets" });
      }
      return lines;
    }
    case "style":
      return styleLines(style).map((text) => ({ text, format: "bullets" }));
    case "style-avoid":
      return (style?.avoid ?? []).map((text) => ({ text, format: "bullets" }));
    case "accept": {
      const lines = [];
      for (const section of template.sections) {
        for (const p of section.parts) {
          if (p.kind !== "modules" || overridden.has(p.category)) continue;
          for (const { module } of orderedPicks(ix, recipe, p.category)) {
            if (module.accept) lines.push({ text: module.accept, format: "checklist", moduleId: module.id });
          }
        }
      }
      for (const item of template.fixed.acceptance ?? []) {
        const text = typeof item === "string" ? item : item.text;
        if (typeof item !== "string" && item.ifSection && !ctx.emitted.has(item.ifSection)) continue;
        lines.push({ text, format: "checklist" });
      }
      if (recipe.onUnclear === "assume" && template.fixed.acceptanceAssume) {
        lines.push({ text: template.fixed.acceptanceAssume, format: "checklist" });
      }
      return lines;
    }
    default:
      return [];
  }
}

function formatLines(lines) {
  let n = 0;
  return lines.map((line) => {
    switch (line.format) {
      case "numbered":
        n += 1;
        return { ...line, text: `${n}. ${line.text}` };
      case "bullets":
        return { ...line, text: `- ${line.text}` };
      case "checklist":
        return { ...line, text: `- [ ] ${line.text}` };
      case "heading":
        n = 0;
        return { ...line, text: `### ${line.text}` };
      default:
        return line;
    }
  });
}

/**
 * @returns {{text: string, blocks: {sectionId: string, title: string, lines: {text: string, moduleId?: string}[]}[], count: number}}
 */
export function assemble(domain, recipe, style = null) {
  const ix = indexDomain(domain);
  const template = domain.template;
  const ctx = { ix, recipe, style, template, emitted: new Set() };
  const blocks = [];
  const used = new Set();

  for (const section of template.sections) {
    const lines = [];
    const seen = new Set();
    for (const part of section.parts) {
      const rendered = renderPart(part, ctx).filter((line) => {
        if (seen.has(line.text)) return false;
        seen.add(line.text);
        return true;
      });
      if (!rendered.length) continue;
      if (part.heading) lines.push({ text: part.heading, format: "heading" });
      lines.push(...rendered);
    }
    if (!lines.length) continue;
    ctx.emitted.add(section.id);
    for (const line of lines) if (line.moduleId) used.add(line.moduleId);
    blocks.push({
      sectionId: section.id,
      title: section.title,
      lines: formatLines(lines).map(({ text, moduleId }) => (moduleId ? { text, moduleId } : { text })),
    });
  }

  const text = blocks
    .map((block, i) => [`${i === 0 ? "#" : "##"} ${block.title}`, ...block.lines.map((l) => l.text)].join("\n"))
    .join("\n\n");

  return { text, blocks, count: used.size };
}
