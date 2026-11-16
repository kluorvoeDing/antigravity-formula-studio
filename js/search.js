// 全站搜尋（純函式）。空白分詞後每個詞都要命中；依命中位置排序。

const norm = (text) => String(text).toLowerCase();

/** 為主題建立搜尋索引。 */
export function buildIndex(domain) {
  const stepOf = new Map(domain.steps.flatMap((step, i) => (step.categories ?? []).map((id) => [id, { step, index: i }])));
  const index = [];
  for (const category of domain.categories) {
    const at = stepOf.get(category.id);
    if (!at) continue;
    category.modules.forEach((module, order) => {
      index.push({
        module,
        category,
        step: at.step,
        stepIndex: at.index,
        order,
        names: [norm(module.zh), norm(module.en)],
        alt: [...(module.aka ?? []), ...(module.tags ?? [])].map(norm),
        body: norm(module.what),
      });
    });
  }
  return index;
}

function scoreToken(entry, token) {
  if (entry.names.some((n) => n.startsWith(token))) return 4;
  if (entry.names.some((n) => n.includes(token))) return 3;
  if (entry.alt.some((n) => n.includes(token))) return 2;
  if (entry.body.includes(token)) return 1;
  return 0;
}

/** 回傳命中的索引項目，分數高的在前；同分維持資料順序。 */
export function search(index, query, limit = 60) {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const hits = [];
  for (const entry of index) {
    let total = 0;
    let ok = true;
    for (const token of tokens) {
      const s = scoreToken(entry, token);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) hits.push({ entry, score: total });
  }
  hits.sort((a, b) => b.score - a.score || a.entry.stepIndex - b.entry.stepIndex || a.entry.order - b.entry.order);
  return hits.slice(0, limit).map((h) => h.entry);
}
