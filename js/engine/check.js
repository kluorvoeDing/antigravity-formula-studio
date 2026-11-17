// 配方檢查：必填、下限、衝突、相依、長度，以及所需的 agent 能力。
import { FACETS } from "../../data/facets.js";
import { indexDomain, allPicked, picksInGroup } from "./domain.js";

export const SOFT_LIMIT = 35;

/**
 * @returns {{level: "todo"|"warn", code: string, msg: string, ids: string[], categoryId?: string, groupId?: string}[]}
 */
export function check(domain, recipe, style = null) {
  const ix = indexDomain(domain);
  const issues = [];
  const picked = allPicked(recipe).filter((id) => ix.modules.has(id));
  const pickedSet = new Set(picked);
  const overridden = new Set(domain.personalStyle ? style?.overrides ?? [] : []);
  const name = (id) => ix.modules.get(id)?.module.zh ?? id;

  for (const category of domain.categories) {
    if (overridden.has(category.id)) continue;
    for (const group of category.groups) {
      const count = picksInGroup(ix, recipe, category.id, group.id).length;
      if (count >= group.min) continue;
      const label = category.groups.length > 1 ? `${category.zh}・${group.zh}` : category.zh;
      issues.push({
        level: "todo",
        code: count === 0 ? "required" : "min",
        msg: count === 0 ? `尚未選擇「${label}」` : `「${label}」至少要選 ${group.min} 個（目前 ${count} 個）`,
        ids: [],
        categoryId: category.id,
        groupId: group.id,
      });
    }
  }

  const reported = new Set();
  for (const id of picked) {
    for (const other of ix.conflicts.get(id) ?? []) {
      const key = [id, other].sort().join("|");
      if (!pickedSet.has(other) || reported.has(key)) continue;
      reported.add(key);
      issues.push({ level: "warn", code: "conflict", msg: `「${name(id)}」與「${name(other)}」互相衝突，請擇一`, ids: [id, other] });
    }
  }

  for (const id of picked) {
    for (const rule of ix.modules.get(id).module.requires ?? []) {
      if (rule.anyOf.some((need) => pickedSet.has(need))) continue;
      issues.push({
        level: "warn",
        code: "requires",
        msg: `「${name(id)}」需要搭配：${rule.anyOf.map(name).join("、")}（${rule.why}）`,
        ids: [id, ...rule.anyOf],
      });
    }
  }

  const byFacet = new Map();
  for (const id of picked) {
    const { module, category } = ix.modules.get(id);
    if (overridden.has(category.id)) continue;
    for (const [facet, value] of Object.entries(module.sets ?? {})) {
      if (!FACETS[facet]?.values[value]) continue;
      if (!byFacet.has(facet)) byFacet.set(facet, []);
      byFacet.get(facet).push({ id, value });
    }
  }
  for (const [facet, claims] of byFacet) {
    if (new Set(claims.map((c) => c.value)).size < 2) continue;
    const detail = claims.map((c) => `「${name(c.id)}」要${FACETS[facet].values[c.value]}`).join("，");
    issues.push({
      level: "warn",
      code: "facet",
      msg: `${FACETS[facet].zh}的要求互相矛盾：${detail}。請擇一`,
      ids: claims.map((c) => c.id),
    });
  }

  if (picked.length > SOFT_LIMIT) {
    issues.push({
      level: "warn",
      code: "long",
      msg: `已選 ${picked.length} 個模組，超過 ${SOFT_LIMIT} 個時 AI 容易漏項，建議刪減`,
      ids: [],
    });
  }
  return issues;
}

/** 步驟狀態，供左欄標示。 */
export function stepStatus(domain, recipe, stepId, style = null) {
  const step = domain.steps.find((s) => s.id === stepId);
  if (!step || !step.categories?.length) return "empty";
  const ix = indexDomain(domain);
  const cats = new Set(step.categories);
  const issues = check(domain, recipe, style);
  const inStep = (issue) =>
    (issue.categoryId && cats.has(issue.categoryId)) ||
    issue.ids.some((id) => cats.has(ix.modules.get(id)?.category.id));

  if (issues.some((i) => i.level === "warn" && i.code !== "long" && inStep(i))) return "issue";
  const count = step.categories.reduce((n, id) => n + (recipe.picks[id]?.length ?? 0), 0);
  if (issues.some((i) => i.level === "todo" && inStep(i))) return count ? "partial" : "empty";
  return count ? "done" : "empty";
}

/** 這份配方需要執行它的 agent 具備哪些能力。 */
export function capabilities(domain, recipe) {
  const ix = indexDomain(domain);
  const needs = new Set();
  for (const id of allPicked(recipe)) {
    for (const cap of ix.modules.get(id)?.module.needs ?? []) needs.add(cap);
  }
  return [...needs];
}

export function moduleCount(domain, recipe) {
  const ix = indexDomain(domain);
  return allPicked(recipe).filter((id) => ix.modules.has(id)).length;
}
