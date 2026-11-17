// 各主題以動態載入取得，首頁只載入當前主題。
export default {
  web: () => import("./web/index.js"),
  video: () => import("./video/index.js"),
  image: () => import("./image/index.js"),
  flow: () => import("./flow/index.js"),
};
