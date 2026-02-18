# TEST-PLAN.md — MeowMeet 測試計劃

## 測試策略

### 測試層級
| 層級 | 工具 | 覆蓋率目標 | 說明 |
|------|------|-----------|------|
| 單元測試 | Vitest | > 80% | 每個模組獨立測試 |
| 整合測試 | Vitest | 關鍵流程 | 模組間協作（Pipeline） |
| E2E 測試 | 手動 | 核心流程 | 完整使用者場景 |

### 測試環境
- macOS 12+ (Monterey / Ventura / Sonoma)
- BlackHole 2ch 已安裝
- Google 帳號已授權
- Whisper small 模型已下載

---

## 單元測試案例

### 音訊模組

#### TC-U01: 音訊裝置列舉
- **模組**: `src/main/audio/capture.ts`
- **前置條件**: 無
- **測試**: 呼叫 `listAudioDevices()` 回傳裝置列表
- **預期結果**: 回傳陣列，包含至少系統預設裝置
- **優先級**: P0

#### TC-U02: BlackHole 偵測
- **模組**: `src/main/audio/capture.ts`
- **前置條件**: BlackHole 已安裝
- **測試**: `detectBlackHole()` 回傳 true
- **預期結果**: 找到 "BlackHole 2ch" 裝置
- **優先級**: P0

#### TC-U03: 音訊分段 — 時間切割
- **模組**: `src/main/audio/chunker.ts`
- **前置條件**: 提供 10 分鐘 WAV 測試檔
- **測試**: `chunkAudio(input, { intervalMs: 180000 })`
- **預期結果**: 產出 3-4 個 WAV 檔案，每個約 3 分鐘
- **優先級**: P0

#### TC-U04: 音訊分段 — 靜音偵測
- **模組**: `src/main/audio/chunker.ts`
- **前置條件**: 提供含靜音段的 WAV
- **測試**: 分段點應在靜音處
- **預期結果**: 不會切在句子中間
- **優先級**: P1

### 轉錄模組

#### TC-U05: Whisper 轉錄 — 中文
- **模組**: `src/main/transcription/whisper.ts`
- **前置條件**: Whisper small 模型已下載
- **測試**: 輸入 30 秒中文 WAV
- **預期結果**: 回傳中文文字，準確率 > 85%
- **優先級**: P0

#### TC-U06: Whisper 轉錄 — 帶時間戳
- **模組**: `src/main/transcription/whisper.ts`
- **測試**: 輸出包含 startTime / endTime
- **預期結果**: 每段文字都有時間標記
- **優先級**: P0

### 摘要模組

#### TC-U07: Gemini 摘要生成
- **模組**: `src/main/summarizer/gemini.ts`
- **前置條件**: Gemini API Key 有效
- **測試**: 輸入模擬逐字稿
- **預期結果**: 回傳結構化 JSON（overview, actionItems, decisions, keyPoints）
- **優先級**: P0

### 輸出模組

#### TC-U08: Google Docs 建立
- **模組**: `src/main/output/googleDocs.ts`
- **前置條件**: OAuth token 有效
- **測試**: 建立測試文件
- **預期結果**: 回傳 Docs URL
- **優先級**: P0

#### TC-U09: Email 寄送
- **模組**: `src/main/output/email.ts`
- **前置條件**: OAuth token 有效
- **測試**: 寄送測試 Email
- **預期結果**: 收到 Email，格式正確
- **優先級**: P0

---

## 整合測試案例

#### TC-I01: 錄音 → 分段 → 轉錄 Pipeline
- **前置條件**: BlackHole + Whisper 就緒
- **步驟**:
  1. 啟動錄音 60 秒
  2. 觸發切段
  3. 自動送轉錄
- **預期結果**: 60 秒內產出轉錄文字
- **優先級**: P0

#### TC-I02: 轉錄 → 摘要 → 輸出 Pipeline
- **前置條件**: 已有轉錄文字 + Google 授權
- **步驟**:
  1. 觸發摘要生成
  2. 建立 Google Docs
  3. 寄送 Email
- **預期結果**: Docs 建立成功 + Email 送達
- **優先級**: P0

---

## E2E 手動測試案例

#### TC-E01: 完整會議流程
- **前置條件**: 全部設定完成
- **步驟**:
  1. 開啟 Google Meet（可用測試會議）
  2. 開啟 MeowMeet → Start Recording
  3. 講話 5 分鐘（中文）
  4. Stop Recording
  5. 等待處理
- **預期結果**:
  - [ ] 音量指示器有反應
  - [ ] 進度條顯示轉錄進度
  - [ ] 5 分鐘內收到 Google Docs
  - [ ] 5 分鐘內收到 Email
  - [ ] 摘要內容合理
  - [ ] 逐字稿可讀

#### TC-E02: 長時間會議（30+ 分鐘）
- **目的**: 驗證記憶體穩定性
- **預期結果**: 記憶體使用 < 2GB，不當掉

#### TC-E03: 暫停恢復
- **步驟**: Start → Pause 2 分鐘 → Resume → Stop
- **預期結果**: 暫停期間不錄音，恢復後正常

---

## 非功能測試

### 效能
- 轉錄延遲 < 30 秒/段（3 分鐘音訊）
- 會後摘要產出 < 5 分鐘
- 記憶體 < 2 GB（持續錄製 1 小時）

### 安全
- OAuth token 存在 Electron safeStorage（非明文）
- 音訊檔案不上傳（本機處理）
- 無硬編碼 credentials

### 相容性
- macOS 12 Monterey
- macOS 13 Ventura
- macOS 14 Sonoma
- Intel + Apple Silicon
