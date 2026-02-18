# TASKS.md — 任務拆解

## MVP v0.1 任務清單

### Sprint 1: 專案基礎 (Day 1)

#### Task 1: 專案初始化
- **Issue**: #1
- **Branch**: `feat/project-setup`
- **內容**:
  - Electron + TypeScript + React 專案建立
  - ESLint + Prettier 設定
  - Vitest 設定
  - electron-builder 設定
  - 目錄結構建立
- **驗收條件**: `npm run dev` 可啟動 Electron 視窗，顯示 Hello World

#### Task 2: CI Pipeline
- **Issue**: #2
- **Branch**: `feat/ci-pipeline`
- **內容**:
  - GitHub Actions: build + lint + test
  - PR Template
  - Issue Templates (feature / bug)
- **驗收條件**: PR 觸發 CI，全部 pass

---

### Sprint 2: 音訊核心 (Day 2-3)

#### Task 3: 音訊擷取模組
- **Issue**: #3
- **Branch**: `feat/audio-capture`
- **依賴**: Task 1
- **內容**:
  - BlackHole 音訊輸入偵測
  - 開始/停止錄音
  - 音量監測（VU meter）
  - WAV 格式輸出（16kHz mono）
- **驗收條件**: 能錄到 BlackHole 的音訊並存成 WAV

#### Task 4: 音訊分段器
- **Issue**: #4
- **Branch**: `feat/audio-chunker`
- **依賴**: Task 3
- **內容**:
  - 每 N 分鐘（可設定，預設 3 分鐘）自動切段
  - 靜音偵測避免切在句子中間
  - 段落暫存管理
- **驗收條件**: 10 分鐘錄音自動切成 3-4 段 WAV

---

### Sprint 3: 轉錄引擎 (Day 3-4)

#### Task 5: Whisper 整合
- **Issue**: #5
- **Branch**: `feat/whisper-integration`
- **依賴**: Task 4
- **內容**:
  - whisper.cpp 或 faster-whisper 整合
  - 模型下載腳本（setup-whisper.sh）
  - 中文轉錄（language=zh）
  - 帶時間戳輸出
- **驗收條件**: 輸入 WAV → 輸出中文逐字稿（準確率 > 85%）

#### Task 6: 即時轉錄 Pipeline
- **Issue**: #6
- **Branch**: `feat/realtime-pipeline`
- **依賴**: Task 4, 5
- **內容**:
  - 音訊切段 → 自動送轉錄 → 暫存結果
  - 進度回報到 UI
  - 錯誤重試機制
- **驗收條件**: 錄音過程中，每段自動轉錄完成，UI 顯示進度

---

### Sprint 4: AI 摘要 + 輸出 (Day 5-6)

#### Task 7: Gemini 摘要模組
- **Issue**: #7
- **Branch**: `feat/gemini-summarizer`
- **依賴**: Task 6
- **內容**:
  - 彙整所有段落逐字稿
  - Gemini API 呼叫（結構化 prompt）
  - 輸出：摘要 + 行動項目 + 決策 + 討論點
- **驗收條件**: 輸入逐字稿 → 輸出結構化 JSON 摘要

#### Task 8: Google OAuth + Docs 輸出
- **Issue**: #8
- **Branch**: `feat/google-docs-output`
- **依賴**: Task 7
- **內容**:
  - Electron OAuth flow（BrowserWindow）
  - Token 安全存儲（safeStorage）
  - Google Docs 建立 + 格式化
  - 歸檔到指定資料夾
- **驗收條件**: 自動建立 Google Doc，內容格式正確

#### Task 9: Email 通知
- **Issue**: #9
- **Branch**: `feat/email-notification`
- **依賴**: Task 7, 8
- **內容**:
  - Gmail API 寄送摘要
  - Email 模板（HTML）
  - 包含 Docs 連結
  - 收件人設定
- **驗收條件**: 收到格式正確的摘要 Email

---

### Sprint 5: UI + 整合 (Day 7-8)

#### Task 10: 控制面板 UI
- **Issue**: #10
- **Branch**: `feat/control-panel-ui`
- **依賴**: Task 6
- **內容**:
  - 開始/停止/暫停按鈕
  - 錄音時長顯示
  - 音量指示器
  - 轉錄進度條
  - 系統匣常駐
- **驗收條件**: UI 可控制完整錄音流程

#### Task 11: 設定頁面
- **Issue**: #11
- **Branch**: `feat/settings-page`
- **內容**:
  - 音訊輸入裝置選擇
  - 分段間隔設定
  - Google 帳號管理
  - Email 收件人設定
  - Whisper 模型選擇
- **驗收條件**: 設定可儲存並生效

#### Task 12: 首次使用引導
- **Issue**: #12
- **Branch**: `feat/onboarding`
- **依賴**: Task 8, 11
- **內容**:
  - BlackHole 安裝檢測 + 引導
  - 音訊權限請求
  - Google OAuth 授權引導
  - Whisper 模型下載進度
- **驗收條件**: 新使用者能順利完成所有設定

---

### Sprint 6: 打包發布 (Day 9)

#### Task 13: 打包 + 測試
- **Issue**: #13
- **Branch**: `feat/build-release`
- **內容**:
  - electron-builder macOS DMG 打包
  - 應用程式簽名（如有 Apple Developer）
  - 端到端測試
  - README 撰寫
- **驗收條件**: 產出可安裝的 .dmg，完整流程可運作

---

## 預估時程
| Sprint | 天數 | 內容 |
|--------|------|------|
| 1 | 1 天 | 專案基礎 + CI |
| 2 | 2 天 | 音訊擷取 + 分段 |
| 3 | 2 天 | Whisper 轉錄 |
| 4 | 2 天 | AI 摘要 + Google 輸出 |
| 5 | 2 天 | UI + 整合 |
| 6 | 1 天 | 打包發布 |
| **Total** | **~10 天** | **MVP v0.1** |
