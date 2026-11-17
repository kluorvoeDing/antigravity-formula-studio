# Flow 影片模組：撰寫補充規範

先讀 `docs/AUTHORING.md`，再讀這份。範本在 `data/flow/template.js`，模組清單在 `docs/flow-module-roster.md`。
以下事實來自 2026 年 11 月查證的官方文件（support.google.com/flow、Google Cloud 的 Veo 提示詞指南），寫內容時以此為準，不要寫官方沒有的功能。

## 官方事實（查證過）

- 預設影片模型是 Omni Flash 1.2；另有 Veo 3.1 Lite／Fast／Quality（Fast、Quality 將於 2026-12-05 退役）。不要在模組裡寫死模型名稱，除非該功能只有某個模型能用。
- 生成方式：Video 底下有 Frames（首幀；首尾幀）與 Ingredients（參考圖或影片，在提示詞用 `@` 引用素材）。Extend 需要付費方案與 Omni Flash 1.2，可附最多 3 張參考圖；Veo 的 Extend 已退役。Scenebuilder 可以把片段排成一整段。
- 片長：Omni Flash 1.2 免費 3–10 秒、付費 3–15 秒；Veo 3.1 為 4、6、8 秒；Ingredients 在 Lite／Fast 固定 8 秒。
- 比例：16:9 與 9:16。
- 會生成聲音（專案設定可改成無聲）。
- 官方提示詞公式：[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]。範本已依此排序：景別與運鏡在前，鏡頭描述在中，風格、光線、聲音在後。
- 運鏡術語：static、pan、tilt、dolly、truck、pedestal、zoom、crane shot、aerial/drone、handheld、whip pan、arc shot。
- 景別與角度：eye-level、low-angle、high-angle、bird's-eye、worm's-eye、dutch angle、close-up、extreme close-up、medium shot、full shot、wide/establishing、over-the-shoulder、POV。
- 光線：soft morning sunlight、overcast daylight、moonlight、candlelight、neon、Rembrandt、film noir、high-key、low-key、volumetric、backlighting、golden hour、dramatic side lighting。
- 聲音寫法：音效用 `SFX: ...`，環境音用 `Ambient noise: ...`；對白官方文件互相矛盾（引號或冒號），用 `<角色> says: <台詞>` 較保守。
- 從圖片生成時，提示詞只寫動作與運鏡，不要重述圖片裡已有的人物、背景、光線。
- 負面提示：不要寫 no 或 don't，直接列出要排除的東西（例如 `on-screen text, subtitles, captions`）。
- 角色一致：把完整的角色描述原封不動貼進每一段，或用 Ingredients 參考圖。

## 兩種欄位

- **中文類別（mode、settings）**：寫 `prompt`（30–200 字），內容是「在介面上要怎麼選、選了之後提示詞要怎麼寫」的操作說明，會列在「Flow 設定」段落。不寫 `promptEn`。
- **英文類別（shot、camera、look、sound、avoid）**：寫 `promptEn`（8–240 個字元的英文），會直接接進每一段英文提示詞，所以要是可以串在句子裡的片段或短句：
  - shot／camera：以名詞片語開頭、句號結尾，例如 `Medium shot at eye level.`、`The camera slowly dollies in toward the subject.`
  - look：一到兩句，例如 `Shot on 35mm film with soft grain and natural color.`
  - sound：用官方寫法，例如 `Ambient noise: distant traffic and a quiet café hum.`
  - avoid：只列名詞，用逗號分隔，不加句號，例如 `on-screen text, subtitles, captions`
  - 不寫 `prompt`（中文）。
- `what`、`when`、`avoid`、`note` 仍用繁體中文寫給使用者看。`note` 可放使用提醒（例如「這個運鏡寫在個別鏡頭裡效果更好」）。

## 預覽

- 景別與角度、規格用 `frame`（合法值見 `data/schema.js` 的 `FRAME`）。
- 其他沒有合適預覽就不加。

## 標籤

只能用 `data/schema.js` 的 `TAGS`，例如：鏡頭、運鏡、構圖、光線、聲音、規格、一致性、影片、入門、進階。
