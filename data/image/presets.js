// 現成配方：一組可直接使用的選取，當作起點。
const i = (category, ...slugs) => slugs.map((s) => `image.${category}.${s}`);
const avoid = (...extra) => i("avoid", "no-watermark", "no-stray-text", ...extra);

export default [
  {
    id: "product-photo",
    zh: "商品棚拍照",
    what: "方形商品照：單一商品、乾淨背景、窗邊柔光，一側留白可放文字。",
    picks: {
      use: i("use", "product-shot"),
      composition: i("composition", "negative-space"),
      aspect: i("aspect", "ratio-1-1"),
      style: i("style", "studio-product"),
      lighting: i("lighting", "soft-window"),
      avoid: avoid("no-clutter"),
    },
  },
  {
    id: "risograph-poster",
    zh: "孔版印刷海報",
    what: "直式海報：孔版印刷質感、互補撞色，標題逐字照抄放在留白處。",
    picks: {
      use: i("use", "poster"),
      composition: i("composition", "wide-shot", "negative-space"),
      aspect: i("aspect", "ratio-2-3"),
      style: i("style", "risograph"),
      color: i("color", "complementary"),
      text: i("text", "exact-quote", "cjk-lettering"),
      avoid: avoid("original-only"),
    },
  },
  {
    id: "film-portrait",
    zh: "底片人像",
    what: "直式人像：底片顆粒、黃金時刻逆光、85mm 柔焦背景，不放任何文字。",
    picks: {
      use: i("use", "social-post"),
      composition: i("composition", "medium-shot", "rule-of-thirds"),
      aspect: i("aspect", "ratio-2-3"),
      style: i("style", "film-photo"),
      lighting: i("lighting", "golden-hour", "lens-85mm"),
      color: i("color", "muted-film"),
      text: i("text", "no-text"),
      avoid: avoid("no-plastic-skin"),
    },
  },
  {
    id: "comic-grid",
    zh: "四格分鏡",
    what: "一張圖裡的 2×2 四格動畫風分鏡，同一個原創角色、粉彩配色。",
    picks: {
      use: i("use", "comic-grid"),
      aspect: i("aspect", "ratio-1-1"),
      style: i("style", "anime-cel"),
      lighting: i("lighting", "soft-window"),
      color: i("color", "pastel"),
      avoid: avoid("original-only"),
    },
  },
];
