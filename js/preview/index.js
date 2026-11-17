// 依規格的 kind 分派到對應的渲染器。沒有預覽或不認得的規格回傳 null。
import { renderWire } from "./wire.js";
import { renderSpecimen, renderType, renderPalette, renderShape, renderMotion, renderTree, renderCopy, renderVersus, renderFrame } from "./kinds.js";

const RENDERERS = {
  wire: renderWire,
  specimen: renderSpecimen,
  type: renderType,
  palette: renderPalette,
  shape: renderShape,
  motion: renderMotion,
  tree: renderTree,
  copy: renderCopy,
  versus: renderVersus,
  frame: renderFrame,
};

export function renderPreview(spec) {
  const render = spec && RENDERERS[spec.kind];
  return render ? render(spec) : null;
}
