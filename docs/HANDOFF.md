# 交接文件

給接手這個專案的人或 AI。讀完這份與 `docs/AUTHORING.md` 就能繼續做，不需要回頭翻對話紀錄。

最後更新：2026-11-16。更新這份文件時請同步改這一行與「目前進度」。

## 這個專案是什麼

「配方圖鑑」：一個純靜態網站，讓使用者一步一步挑選模組，組出一份**任何 AI 都看得懂**的完整提示詞。每個模組同時是一張教學卡，教一個名詞。

使用者的動機（做決定時以此為準）：

1. 自己缺乏提示詞要點與靈感，想靠模組化補足。
2. 想藉此學會網頁技術的名詞與應用場景。
3. 想穩定產出自己的樣式與版型（所以有「個人風格」功能）。

使用者已確認的決定：

- 四個主題的優先順序：**網頁生成 > 動態影片 > ChatGPT 圖片生成 > Google Flow 影片生成**。
- 提示詞必須貼到 ChatGPT 網頁版、Codex、Claude Code、Antigravity 都能用。不輸出代號，不提任何 AI 產品名稱。
- 網頁主題只做「整站一次生成」，不做單一區塊追加。
- 操作流程是「步驟式圖鑑」：左欄步驟、中欄教學卡、右欄配方與提示詞。
- 外觀是「色票型錄」：每個步驟一個高飽和純色、黑字、2px 黑框、標題字很大很重。使用者明確討厭 Bento、膠囊分頁、藍紫漸層、點陣背景這類「AI 罐頭」外觀。
- 教學卡的內容份量（預覽、中英名詞、是什麼、何時用、何時別用）使用者說「剛好」，照現在的寫法即可。
- 所有給使用者看的文字用**繁體中文（台灣用語）、全形標點**。

## 硬性限制

- **零建置、零 npm 相依**。專案放在 iCloud Drive，不能有 `node_modules`。不要加 `build` script，也不要建立 `public/` 目錄（會改變 Vercel 的輸出判定）。
- **`js/` 內禁用 `innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`**。所有 DOM 都經 `js/ui/dom.js` 的 `h()` 建立。`validate.mjs` 會掃描。
- `index.html` 有嚴格的 CSP（`script-src 'self'`，樣式不允許行內 `style` 屬性）。動態樣式只能用 `el.style.setProperty`（`h()` 的 `style` 參數就是這樣做）。
- 資料檔是純資料：不含函式、不 import、字串不含 HTML。
- `showreel.html`、`render_video.mjs`、`generate_audio.py` 是另一條影片產製線，**不要動**。
- iCloud 可能產生衝突副本（檔名像 `xxx 2.js`）。一個檔同一時間只給一個代理寫。

## 怎麼跑

```bash
python3 -m http.server 4173        # 本機預覽，開 http://localhost:4173
node scripts/validate.mjs          # 資料與原始碼檢查，必須「檢查通過」
node --test "tests/*.test.mjs"     # 全部要過
node scripts/assemble.mjs web --preset saas-landing --name "Tidepool"   # 印出提示詞
UPDATE_GOLDEN=1 node --test "tests/*.test.mjs"   # 模組或範本改動後更新 golden
```

本機預覽的坑：`python3 -m http.server` 不送快取標頭，瀏覽器會用舊的 CSS／JS。改完檔案要強制重新載入（或在主控台對改過的檔案 `fetch(url, { cache: "reload" })` 再 `location.reload()`）。

## Git 與部署

- 工作分支：`redesign`（已推到 GitHub）。`main` 還停在舊版；舊版另有標籤 `v2.5`。
- **正式站目前跑的是 `redesign` 的內容**（2026-11-16 部署，對應 commit `befefc3`：239 個模組、搜尋、矛盾檢查）：<https://antigravity-formula-studio.vercel.app>
- GitHub **沒有**連動 Vercel。上線靠 CLI：`vercel deploy --prod --yes`。預覽部署（不加 `--prod`）需要登入 Vercel 才看得到。
- **每次部署到正式站、合併到 `main` 之前，都要先取得使用者明確同意。** 權限機制也會擋下未經同意的正式部署。
- 尚未決定：是否把 `redesign` 合併回 `main`。目前兩者不一致，請向使用者確認。
- 退回舊版：`git checkout v2.5` 後 `vercel deploy --prod`，或在 Vercel 後台把上一個正式部署重新 promote。
- 部署後檢查：`/.env.local`、`/output/…`、`/scripts/…`、`/tests/…`、`/docs/…` 都應回 404（由 `.vercelignore` 控制）。
- commit 訊息用英文、祈使句，結尾加上當下模型的 `Co-Authored-By` 行。

## 架構

```
index.html              外殼：頁首、三欄容器、CSP
css/tokens.css          設計變數；[data-hue="0…9"] 是十個步驟的顏色
css/app.css             站台樣式
css/preview.css         預覽基元（.pv-*）；刻意中性，不跟站台外觀
data/schema.js          常數：TAGS、WIRE_PRIMS、PREVIEW_FONTS、MOTION_NAMES、LIMITS、BANNED、VAGUE
data/facets.js          面向（陰影、圓角、漸層、深淺色）與可用的值
data/registry.js        主題的動態載入表（目前只有 web）
data/styles.js          內建的個人風格
data/web/index.js       步驟、類別順序
data/web/NN-<類別>.js   每類一檔
data/web/presets.js     現成配方
data/web/template.js    提示詞範本（段落結構與固定文字）
js/engine/domain.js     索引與配方基本操作
js/engine/select.js     toggle / reorder / applyPreset / sanitize
js/engine/check.js      必填、衝突、相依、能力
js/engine/assemble.js   配方 → 提示詞（回傳 text 與逐行的 moduleId）
js/preview/             wire.js（線框）、kinds.js（其餘八種）、index.js（分派）
js/ui/                  dom.js、steps.js、catalog.js、recipe.js、style-editor.js、toast.js
js/store.js, state.js   狀態容器與操作
js/persist.js           localStorage（key: ag_formula_hub_v4）、清理、v3 遷移、網址片段
js/main.js              啟動
scripts/validate.mjs    檢查；scripts/assemble.mjs 命令列組裝
tests/                  fixture.mjs 是測試用小主題；golden/ 是三個配方的提示詞快照
```

資料流：使用者操作 → `state.js` 的 action → `engine` 純函式算出新配方 → `store.set` → 各個 view 訂閱後重繪。`catalog.js` 在配方變動時只修補卡片的選取狀態，換步驟才整個重繪，這樣焦點不會跑掉。

提示詞的每個模組輸出一行 `中文名（English）：指示句`。範本零件的種類見 `js/engine/assemble.js` 的 `renderPart`：`text`、`unclear`、`brief`、`freetext`、`fixed`、`modules`、`style`、`style-avoid`、`accept`。

## 目前進度

| 階段 | 狀態 |
|---|---|
| P0 資料契約、引擎、測試 | 完成 |
| P1 外觀方向 | 完成（使用者選 B 色票型錄） |
| P2 三欄介面、個人風格、保存、種子模組 | 完成，已上線 |
| P3 網頁資料庫擴充到 200+ | 資料已寫完（239 個）；**收尾待辦**見下 |
| P4 學習功能 | 搜尋、別名、相關名詞已完成；其餘未開始 |
| P5 其他三個主題 | 未開始 |

網頁主題目前的模組數請以 `node scripts/validate.mjs` 的輸出為準。完整的目標清單在 `docs/web-module-roster.md`，清單上標 ✅ 的已寫完。

## P3 收尾待辦

14 類共 239 個模組都已寫進資料檔，validate 零錯誤。新模組由子代理撰寫（Opus 與 Sonnet 混用），主代理只抽查了區塊、版型、禁令、元件各幾個，品質不錯，但**沒有逐一讀過**。接手後請做：

1. **逐類通讀**：每類至少讀一半，重點看 `en` 是否為真實術語、`when`／`avoid` 是否具體、`prompt` 有沒有替別的類別做決定。元件類請核對 ARIA 屬性名稱。技術類請核對框架的指令與檔案結構。
2. **跨類矛盾**：用 `scripts/assemble.mjs` 印出幾組不同配方的完整提示詞，從頭讀一遍找互相打架的句子。已知可疑：`web.layout.single-column` 的「文字欄寬不超過 720px」。
3. **補 `sets`**：見下方「提示詞互相矛盾」一節的待辦。
4. **跨檔 `related`**：子代理只能連到自己檔案內的模組。請補上跨類別的連結（例如主視覺區塊 ↔ 產品截圖、跑馬燈 ↔ 客戶標誌列）。
5. **配方擴充到 8–12 個**：目前只有 3 個（`data/web/presets.js`）。每個網站類型至少一個；配方不可有面向衝突（validate 會擋）。寫完跑 `UPDATE_GOLDEN=1`。
6. **預覽**：元件類有些用近似基元（進度條用分隔線、徽章與開關用籌碼）。值得的話在 `WIRE_PRIMS` 補 `progress`、`badge`、`toggle` 等基元。動態預覽在瀏覽器確認過會顯示、預設暫停；「滑鼠移上去才播放」沒有逐一看過。
7. 禁令類上限是 8 個、現有 14 個可選；品質類上限已調為 10。可視使用情況調整。

## 之後要再新增模組時

1. 開 `docs/web-module-roster.md`，挑一個還有未完成項目的類別。
2. 先讀 `docs/AUTHORING.md` 與該類別檔案裡已有的模組，照同樣的品質寫。
3. 把新模組加進 `data/web/NN-<類別>.js`。**既有模組的 `id` 不要改**（使用者的存檔與配方會參照）。
4. `node scripts/validate.mjs data/web/NN-<類別>.js` 到零錯誤，再跑一次不帶參數的完整檢查。
5. 在清單上把完成的項目標 ✅，commit（一個類別一個 commit）。
6. 全部類別寫完後：補跨檔的 `related`、把配方擴充到 8–12 個、跑 `UPDATE_GOLDEN=1` 更新快照。

內容品質的教訓（已寫進 `AUTHORING.md`，但值得再說一次）：

- **模組不要替別的類別做決定。** 實際發生過的矛盾：版型模組寫「內容區最大寬度 720px」卻和三欄卡片區塊衝突；截圖模組順手寫「加一層陰影」卻和「全站不用陰影」衝突；動態強度寫「所有過渡 250 毫秒內」卻和 500 毫秒的捲動淡入衝突。寫完一批後，請用 `scripts/assemble.mjs` 印出一份完整提示詞從頭讀一遍，找這種互相打架的句子。
- `en` 必須是真實存在、搜尋得到的業界術語。這是使用者學名詞的依據。
- `when` 與 `avoid` 要是能拿來做判斷的具體情境，不同模組不要套同一個句型。`avoid` 不可以只是 `when` 的反面。
- `what` 描述畫面上看得到什麼，不要用空泛形容詞。
- `prompt` 盡量量化，並交代窄螢幕時怎麼變。

`12-quality.js` 裡 `a11y-basics` 與 `semantic-html` 的 `avoid` 目前寫得很弱（「沒有不適用的情況」），擴充時請一併改寫。

若要平行交給子代理：一個子代理只寫一個檔；把 `docs/AUTHORING.md`、該檔現有內容、清單上該類的項目交給它；要求它回報前自己跑 validate。主代理收回後要抽查內容，不能只看 validate 通過。

需要新的預覽能力時：

- 新的線框基元：加進 `data/schema.js` 的 `WIRE_PRIMS`、`js/preview/wire.js` 的 `PRIMS`、`css/preview.css`。
- 新的動態預覽：加進 `MOTION_NAMES`、`js/preview/kinds.js` 的 `renderMotion`、`css/preview.css` 的 keyframes。動畫預設暫停，滑鼠移到卡片上才播放。
- 玻璃擬態這類靠變數分不出來的風格，可以在 `renderSpecimen` 用 `effect` 加一個具名效果。

## 提示詞互相矛盾：怎麼處理（不靠 AI）

使用者問過要不要串 AI API 來「優化」提示詞以消除矛盾。結論是不需要，改用三層確定性的做法：

1. **源頭**：模組不替別的類別做決定（見上方「內容品質的教訓」與 `AUTHORING.md`）。
2. **面向檢查**（`data/facets.js`、`js/engine/check.js`）：模組用 `sets` 宣告自己對整站面向的要求（目前有 `shadow`、`radius`、`gradient`、`theme`）。兩個已選模組對同一面向要求不同時，右欄會出現紅色提醒，點了跳到該步驟。被個人風格接管的類別不參與。`validate.mjs` 會檢查 `sets` 的鍵與值，配方（presets）若有面向衝突也會報錯。
3. **優先順序條款**（`data/web/template.js` 的「任務」段落）：提示詞明講牴觸時誰優先，並要求把取捨列入「我的假設」。收到提示詞的本來就是 AI，由它在執行時依規則取捨，不需要另一個 AI 先改寫。

**待辦**：`sets` 目前只標了視覺風格的 12 個、間距與形狀的 6 個、色彩的 2 個。還沒標的：視覺風格其餘 6 個（terminal、luxury-minimal、hand-drawn、bauhaus、memphis、organic）、`color-blocking`、禁令類（例如 `no-purple-gradient` 應為 `gradient: "none"`、`no-default-shadows`、`no-glass-everywhere`）。標註前要讀該模組的 `prompt`，只有它明確規定時才標。需要新的面向（例如 `border`、`glass`、`motion`）就加進 `data/facets.js`。

若日後仍想提供「AI 潤稿」：做成選用功能，使用者自己貼金鑰、只存在瀏覽器本機；CSP 的 `connect-src` 要加上該 API 的網域。不要讓它成為產生提示詞的必要步驟。

## P4：學習功能（依建議順序）

1. ~~全站搜尋~~：**已完成**（`js/search.js`、頁首搜尋框、快速鍵 `/` 與 Esc）。
2. ~~相關名詞與別名~~：**已完成**（卡片顯示「又稱」與「相關」，點相關名詞會跳到該模組，由 `main.js` 的 `openModule` 處理）。
3. **點提示詞的行跳回模組**：`recipe.js` 已經記錄每一行對應的 `moduleId`（`lines` 陣列），目前只做了滑過卡片時標亮該行，反方向還沒做。
4. **匯入匯出 JSON**：匯出 `snapshot()` 的內容；匯入一律經過 `sanitize()` 與 `sanitizeStyle()`。
5. **分享連結**：只把模組 id 放進網址，不放簡述文字與個人風格；載入時經 `sanitize()`，套用後把參數從網址移除。
6. **靈感骰子**：隨機產生一份符合選擇規則的配方（每個必填組都有選、不超過上限、不含衝突）。洗牌用 Fisher–Yates。
7. **深色模式**：`css/tokens.css` 加一組深色變數，跟隨系統並可手動切換、記住選擇。色塊上的字一律維持深色。
8. 行動版改良：小螢幕時右欄改成底部固定列加抽屜。

## P5：其他三個主題

現況：頁首把這三個主題標成「即將加入」，`data/registry.js` 只有 `web`，`js/main.js` 寫死載入 `web`。要做的事：

1. `main.js` 支援切換主題（狀態裡已有 `domainId`；`persist.js` 的 `snapshot` 以 `recipes[domainId]` 存放，`restore` 目前只讀一個主題，需要改成每個主題各一份）。
2. 每個主題建 `data/<主題>/`，結構同 `data/web/`。
3. 各自的範本。`assemble.js` 需要新增零件格式：
   - **動態影片**：開發型任務，但要工具中立。預設交付「單檔 HTML 動畫（固定時間軸、瀏覽器可播放）」，算圖成影片檔列為進階選項（否則只能聊天的工具做不出來）。
   - **圖片**：不是開發任務。輸出短標籤行：主體／構圖／風格與媒材／光線與鏡頭／色彩／畫面文字／比例／避免。需要一個把同類模組的指示句合併成一行的格式。
   - **Flow**：每個鏡頭一段、可獨立貼上；預設輸出**英文**（模組多一個英文片語欄位），介面保留中文說明。Flow 目前的功能名稱與可控參數**還沒查證**，寫資料前要先查官方文件。
4. 舊版的選項可當種子參考：`git show v2.5:index.html`，資料在第 2126–2293 行。舊選項寫死了這個 repo 的工具鏈（SciPy 音軌、`--sub-offset`、無頭瀏覽器截圖），搬過來時要改寫成工具中立。
5. 計畫原本約定：這三個主題的資料庫要加深時，各自先和使用者討論一輪範圍再做。

## 驗證過與沒驗證過的

- 30 項自動測試、資料檢查：通過。
- 瀏覽器實測（桌面 1440、手機 375）：套用配方、衝突時詢問取代、個人風格接管、重新整理後狀態仍在、輸入惡意字串不執行、無橫向捲軸、主控台無錯誤。
- 通用性：把 SaaS 配方的提示詞交給 Codex，沒有反問、產出單一 HTML、區塊順序正確、無漸層陰影表情符號、附假設清單。**只做了檔案內容檢查，沒有看實際畫面。**
- **沒驗證**：Antigravity（執行失敗、無產出）、ChatGPT 網頁版、Claude Code。使用者表示會自己從線上試用後回饋。
- **沒驗證**：純鍵盤走完整個流程、螢幕閱讀器、Safari 與 Firefox。

## 已知的小問題

- 右欄「已選模組」清單高度上限 30vh，選很多時要在小區域內捲動。
- 個人風格編輯器的選填顏色（卡片底色、次要文字、點綴色）未勾選時仍顯示灰色色塊，容易誤會。
- 預覽的字體用系統字體堆疊，Windows 上的明體、圓體樣本會和 macOS 長得不一樣。
- 網站名稱「配方圖鑑／Prompt Field Guide」是暫定的，使用者還沒確認。
