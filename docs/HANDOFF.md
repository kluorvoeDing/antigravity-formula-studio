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

- `redesign` 已於 2026-11-16 合併回 `main`（快轉），兩者一致。之後直接在 `main` 開新分支工作即可。舊版保留在標籤 `v2.5`。
- **正式站目前跑的是 `main` 的內容**（2026-11-16 部署，對應 commit `befefc3`：239 個模組、搜尋、矛盾檢查）：<https://antigravity-formula-studio.vercel.app>
- GitHub **沒有**連動 Vercel。上線靠 CLI：`vercel deploy --prod --yes`。預覽部署（不加 `--prod`）需要登入 Vercel 才看得到。
- **每次部署到正式站、合併到 `main` 之前，都要先取得使用者明確同意。** 權限機制也會擋下未經同意的正式部署。
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
| P3 網頁資料庫擴充到 200+ | 完成（240 個模組、12 個配方）；剩餘的小議題見下 |
| P4 學習功能 | 搜尋、別名、相關名詞已完成；其餘未開始 |
| P5 其他三個主題 | 未開始 |

網頁主題目前的模組數請以 `node scripts/validate.mjs` 的輸出為準。完整的目標清單在 `docs/web-module-roster.md`，清單上標 ✅ 的已寫完。

## P3 收尾（2026-11-17 完成）

做了什麼：

- **逐類通讀**：14 類全部模組由 6 個 Sonnet 子代理逐一讀過、主代理抽查差異，約 90 處修正。重點是拿掉「替別的類別做決定」的句子（陰影、圓角、行寬、字級、動畫時長）、核對 ARIA 與 APG 鍵盤操作、框架與 Tailwind v4 的寫法、WCAG 與 Core Web Vitals 數值，以及把 `avoid` 改成真實的取捨情境。
- **跨類矛盾**：用 `scripts/assemble.mjs` 讀過 event、dashboard、saas-landing 三份完整提示詞。修了範本「虛構數字」與「禁止捏造」的矛盾（改為客戶、見證、成果數字一律標「示意」）、定價表寫死月繳年繳、緊湊密集指定字級、響應式要求所有目標 44px。
- **`sets`**：新增 `border`（none / hairline / thick）與 `glass`（limited / used）兩個面向；標註的模組從 20 個增加到 30 個（風格 18 個全標完、形狀、禁令）。`no-default-shadows` 刻意不標：它只禁擴散淡陰影，不禁硬陰影，現有面向表達不了。
- **`conflicts`**：`scroll-reveal` ↔ `no-fade-in-everything`、`theme-toggle` ↔ `light-only`／`dark-only`、`hero-centered` ↔ `no-generic-hero`。
- **跨類別 `related`**：加了 271 條（雙向，每個模組最多 5 條）。
- **配方**：3 → 12 個，每種網站類型一個，皆無面向衝突、不超過 35 個模組，golden 快照 12 份。12 份完整提示詞都從頭讀過一遍，挑選彼此打架的地方已換掉。
- **新模組** `web.section.link-list`（連結按鈕清單）：連結集合頁的核心內容原本沒有區塊可以表達。
- **範本**：優先順序條款加入「網站類型」（排在禁止事項之後、視覺風格之前），讓網站類型的要求能蓋過個別區塊的細節。
- **預覽**：新增 `progress`、`badge`、`toggle` 三個線框基元，進度條、徽章、開關三個元件改用它們。

子代理回報但**刻意沒處理**的議題（之後可再決定）：

1. `web.color.high-contrast` 在單選組 `mode` 裡，但它其實是「疊加」用的，選了會擠掉淺色／深色設定。要改組需要動 `groups`，會影響使用者存檔。
2. `web.section.gallery-grid`、`faq-accordion`、`feature-tabs` 自帶互動行為，和元件類的 `lightbox`、`accordion`、`tabs` 重複（不矛盾，只是重複）。
3. `web.anti-slop.no-uniform-cards` 限制「全頁最多一個等寬卡片網格」，同時選多個卡片區塊時會靠範本的優先順序條款取捨，沒有加 `conflicts`。
4. `web.component.sticky-cta` 與 `back-to-top` 同選時在手機上可能疊住；`alert-banner` 與 `announcement-bar` 同選時頂端兩條橫幅。
5. `web.tech.css-modules` 的 `requires` 包含 sveltekit，但 Svelte 慣用元件內建 scoped style。
6. `web.media.product-screenshot` 與 `device-mockups` 同選時會要求兩種外框。
7. 頁面區塊規定至少選 3 個，但儀表板這類應用型網站其實不需要行銷區塊。dashboard 配方目前用「數字成果列、時間軸（當作最近活動）、極簡頁尾」湊滿 3 個，是妥協。可考慮依網站類型放寬下限，但要動引擎的選擇規則。

其他項目：

- 禁令類上限是 8 個、現有 14 個可選；品質類上限 10。可視使用情況調整。
- 動態預覽「滑鼠移上去才播放」仍沒有逐一看過。

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

**狀態**：視覺風格 18 個已全部標註；面向目前有 `shadow`、`radius`、`gradient`、`theme`、`border`、`glass`（見上方「P3 收尾」）。日後新增模組時，只有 `prompt` 明確規定該面向才標；需要新的面向就加進 `data/facets.js`。

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
- 網站名稱「配方圖鑑／Prompt Field Guide」使用者已於 2026-11-16 確認。
- 視窗寬度約 1000px 時，頁首（搜尋框與主題連結）會撐出水平捲軸。
