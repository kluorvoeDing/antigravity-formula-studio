// 在終端機印出某個配方的提示詞。
// 用法：node scripts/assemble.mjs web --preset saas-landing [--name 名稱] [--ask]
import registry from "../data/registry.js";
import { defaultRecipe } from "../js/engine/domain.js";
import { applyPreset } from "../js/engine/select.js";
import { assemble } from "../js/engine/assemble.js";
import { check } from "../js/engine/check.js";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const domainId = args[0] ?? "web";
if (!registry[domainId]) {
  console.error(`沒有這個主題：${domainId}（可用：${Object.keys(registry).join("、")}）`);
  process.exit(1);
}

const domain = (await registry[domainId]()).default;
let recipe = defaultRecipe(domain);
const presetId = flag("preset");
if (presetId) recipe = applyPreset(domain, recipe, presetId);
if (flag("name")) recipe.brief.name = flag("name");
if (args.includes("--ask")) recipe.onUnclear = "ask";

const { text, count } = assemble(domain, recipe);
console.log(text);
console.error(`\n—— ${count} 個模組`);
for (const issue of check(domain, recipe)) console.error(`  ${issue.level === "warn" ? "注意" : "待選"}：${issue.msg}`);
