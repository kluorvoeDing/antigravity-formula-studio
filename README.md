# 配方圖鑑（Prompt Field Guide）

一步一步挑選模組，組出一份**任何 AI 都看得懂**的完整規格。每個模組同時教一個名詞：長什麼樣、何時用、何時別用。

- `index.html`：步驟式圖鑑 + 提示詞組裝器（目前開放「網頁生成」主題）。
- `showreel.html`：30 秒 WebGL2 動態影片（獨立頁面，與組裝器無關）。

## 本機預覽

純靜態、零建置、零相依，但使用 ES 模組，**不能直接雙擊開啟**，需要一個靜態伺服器：

```bash
python3 -m http.server 4173
```

然後開啟 <http://localhost:4173>。

## 檢查與測試

```bash
node scripts/validate.mjs
```

```bash
node --test "tests/*.test.mjs"
```

在終端機印出某個配方的提示詞：

```bash
node scripts/assemble.mjs web --preset saas-landing --name "Tidepool"
```

## 結構

```
data/schema.js          型別與常數（標籤詞表、禁用字眼、長度限制）
data/web/*.js           網頁主題：每個類別一個資料檔、配方、提示詞範本
data/styles.js          內建的個人風格
js/engine/              選取規則、檢查、組裝（純函式，可在 Node 測試）
js/preview/             宣告式預覽規格的渲染器
js/ui/                  三欄介面；所有 DOM 都經由 js/ui/dom.js 建立
js/persist.js           localStorage 保存、清理與舊版遷移
scripts/                資料檢查與命令列組裝
tests/                  node --test 測試與 golden 檔
docs/AUTHORING.md       新增模組時的撰寫規範
```

新增或修改模組前請先讀 `docs/AUTHORING.md`。修改提示詞範本或模組後，若 golden 測試失敗且變更是預期的，用 `UPDATE_GOLDEN=1 node --test "tests/*.test.mjs"` 更新。

## 產生 Showreel 影片檔（選用）

```bash
python3 generate_audio.py
node render_video.mjs
```

需要 Python 的 numpy、scipy，以及 ffmpeg 與 Playwright 的 Chromium。
