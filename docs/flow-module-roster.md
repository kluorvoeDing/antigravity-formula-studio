# Flow 影片模組清單（種子版）

目標 43 個模組。id 前綴為 `flow.<類別>.`，括號內是分組。2026-11-17 全部 43 個已寫進資料檔。
「中文」表示這個類別輸出到中文的設定說明（寫 `prompt`）；「英文」表示輸出到每段英文提示詞（寫 `promptEn`）。

## 01 mode 生成方式（中文，單選，5）
- text-to-video 純文字生成 / Text to Video
- frames-to-video 從首幀開始 / Frames to Video
- first-last-frames 首尾幀 / First and Last Frames
- ingredients 素材參考 / Ingredients to Video
- extend 延伸片段 / Extend

## 02 settings 規格（中文，5）
- (aspect) landscape 橫式 16:9 / Landscape 16:9
- (aspect) vertical 直式 9:16 / Vertical 9:16
- (length) clip-short 4 到 6 秒短片段 / Short Clip
- (length) clip-8s 8 秒標準片段 / 8-Second Clip
- (length) clip-long 10 到 15 秒長片段 / Long Clip

## 03 shot 景別與角度（英文，放在段落最前面，9）
- (size) establishing 遠景建立鏡頭 / Establishing Shot
- (size) medium 中景 / Medium Shot
- (size) close-up 特寫 / Close-Up
- (size) extreme-close-up 大特寫 / Extreme Close-Up
- (angle) low-angle 仰角 / Low-Angle Shot
- (angle) high-angle 俯角 / High-Angle Shot
- (angle) birds-eye 鳥瞰 / Bird's-Eye View
- (angle) over-shoulder 過肩 / Over-the-Shoulder Shot
- (angle) pov 主觀視角 / POV Shot

## 04 camera 運鏡（英文，放在段落最前面，單選，8）
- static 固定鏡頭 / Static Shot
- dolly-in 推軌前進 / Dolly In
- tracking 跟拍 / Tracking Shot
- pan 橫搖 / Pan
- crane-up 升降鏡頭 / Crane Shot
- arc 環繞 / Arc Shot
- handheld 手持 / Handheld Camera
- aerial 空拍 / Aerial Drone Shot

## 05 look 風格與光線（英文，8）
- (style) cinematic-film 電影底片感 / Cinematic Film Look
- (style) documentary 紀錄片 / Documentary Style
- (style) stop-motion 定格動畫 / Stop-Motion Animation
- (style) animated-3d 3D 動畫 / 3D Animation
- (light) golden-hour 黃金時刻 / Golden Hour
- (light) overcast 陰天柔光 / Overcast Daylight
- (light) neon-night 霓虹夜晚 / Neon Night
- (light) low-key 低調光 / Low-Key Lighting

## 06 sound 聲音（英文，複選 0–3，4）
- ambient 環境音 / Ambient Sound
- sfx 音效 / Sound Effects
- dialogue 對白 / Dialogue
- score 配樂 / Music Score

## 07 avoid 排除（英文，複選 0–4，4）
- text-overlays 畫面文字與字幕 / On-Screen Text（預選）
- watermarks 浮水印與標誌 / Watermarks（預選）
- extra-people 多餘人物 / Extra People
- distortion 肢體變形 / Distorted Anatomy
