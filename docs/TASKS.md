# MeowMeet — 任務拆解

## Sprint 0（專案骨架）— 1 天

### Task 1: 專案初始化
- **Issue**: #15
- **Branch**: `feat/task-1-project-init`
- **依賴**: 無
- **子任務**:
  - [ ] `npm create vite@latest` with React + TS template
  - [ ] 設定 manifest.json (MV3)
  - [ ] 安裝 Supabase JS client
  - [ ] 設定 ESLint + Prettier
  - [ ] 設定 Vitest
  - [ ] 設定 vite.config.ts (Chrome Extension build)
  - [ ] 驗證 `npm run build` 成功
  - [ ] 驗證 Chrome 載入 unpacked extension 成功
- **驗收**: Extension 可載入 Chrome，Popup 顯示 Hello World

### Task 2: Supabase Schema 設計
- **Issue**: #16
- **Branch**: `feat/task-2-supabase-schema`
- **依賴**: Task 1
- **子任務**:
  - [ ] `supabase init`
  - [ ] 建立 001_init.sql migration
  - [ ] users table (id, email, display_name, plan_type, created_at)
  - [ ] recordings table (id, user_id, title, duration, status, segment_count, created_at)
  - [ ] transcripts table (id, recording_id, content, speakers, language, created_at)
  - [ ] summaries table (id, recording_id, highlights, action_items, key_dialogues, created_at)
  - [ ] RLS policies
  - [ ] Storage bucket: recordings (private)
  - [ ] `supabase db push` 驗證
- **驗收**: Schema 可成功 apply，RLS 運作正常

### Task 3: API Keys + 環境變數
- **Issue**: #17
- **Branch**: `feat/task-3-env-config`
- **依賴**: Task 1
- **子任務**:
  - [ ] 建立 .env.example
  - [ ] 建立 supabase/.env.example (Edge Function 用)
  - [ ] 更新 .gitignore
  - [ ] 文件說明各 key 取得方式
- **驗收**: 新開發者可依 .env.example 設定環境

---

## Sprint 1（核心錄音）— 5 天

### Task 4: tabCapture 錄音功能
- **Issue**: #18
- **Branch**: `feat/task-4-tab-capture`
- **依賴**: Task 1
- **子任務**:
  - [ ] Background SW: chrome.tabCapture.capture()
  - [ ] MediaRecorder 設定 (WebM/Opus)
  - [ ] Badge 狀態管理 (recording/idle)
  - [ ] 錄音開始/停止 message handler
  - [ ] 單元測試
- **驗收**: 點擊 icon 可開始/停止錄音，badge 正確顯示

### Task 5: 音訊編碼 + 分段上傳
- **Issue**: #19
- **Branch**: `feat/task-5-segment-upload`
- **依賴**: Task 2, Task 4
- **子任務**:
  - [ ] MediaRecorder 5 分鐘 timeslice
  - [ ] Supabase Storage upload 邏輯
  - [ ] 重試機制 (max 3 retries)
  - [ ] IndexedDB 暫存
  - [ ] 上傳狀態追蹤
  - [ ] 單元測試 + 整合測試
- **驗收**: 6 分鐘錄音產生 2 個分段，均上傳成功

### Task 6: 錄音 UI
- **Issue**: #20
- **Branch**: `feat/task-6-recording-ui`
- **依賴**: Task 4
- **子任務**:
  - [ ] Popup 基本 layout (Tailwind CSS)
  - [ ] 開始/暫停/停止按鈕
  - [ ] 計時器顯示
  - [ ] 狀態指示 (idle/recording/paused)
  - [ ] 錄音歷史列表
  - [ ] 與 Background SW 通訊
- **驗收**: Popup 可控制錄音，狀態即時同步

### Task 7: 錄音合規提示
- **Issue**: #21
- **Branch**: `feat/task-7-compliance`
- **依賴**: Task 4
- **子任務**:
  - [ ] 確認對話框 UI
  - [ ] Content Script 注入邏輯
  - [ ] 「不再提示」設定
  - [ ] 頁面內錄音指示器
- **驗收**: 首次錄音顯示提示，確認後開始

---

## Sprint 2（轉錄 + 摘要）— 5 天

### Task 8: Deepgram 語音轉錄
- **Issue**: #22
- **Branch**: `feat/task-8-deepgram`
- **依賴**: Task 5
- **子任務**:
  - [ ] Edge Function: transcribe/index.ts
  - [ ] Deepgram SDK 整合
  - [ ] 中文設定 (language: zh-TW)
  - [ ] Speaker Diarization 設定
  - [ ] 分段合併邏輯
  - [ ] 結果存入 transcripts table
  - [ ] 錯誤處理 + 重試
  - [ ] 整合測試 (MSW mock)
- **驗收**: 上傳音檔後自動產生中文逐字稿

### Task 9: Gemini AI 摘要
- **Issue**: #23
- **Branch**: `feat/task-9-gemini-summary`
- **依賴**: Task 8
- **子任務**:
  - [ ] Edge Function: summarize/index.ts
  - [ ] Gemini Flash API 整合
  - [ ] 摘要 prompt 設計
  - [ ] Structured output (highlights + action_items + key_dialogues)
  - [ ] 結果存入 summaries table
  - [ ] 整合測試 (MSW mock)
- **驗收**: 逐字稿完成後自動產生摘要

### Task 10: 轉錄 + 摘要 UI
- **Issue**: #24
- **Branch**: `feat/task-10-transcript-ui`
- **依賴**: Task 8, Task 9
- **子任務**:
  - [ ] 錄音詳情頁面
  - [ ] 逐字稿 Tab（含講者標記）
  - [ ] 摘要 Tab（highlights + action items）
  - [ ] Action Items 複製功能
  - [ ] 搜尋逐字稿
  - [ ] 狀態指示（轉錄中/完成）
- **驗收**: 可查看錄音的逐字稿和摘要

---

## Sprint 3（用戶系統 + 上架）— 4 天

### Task 11: Google OAuth 登入
- **Issue**: #25
- **Branch**: `feat/task-11-google-auth`
- **依賴**: Task 2
- **子任務**:
  - [ ] chrome.identity.getAuthToken() 設定
  - [ ] Supabase Auth signInWithIdToken
  - [ ] 登入/登出 UI
  - [ ] Token refresh 機制
  - [ ] 未登入狀態 redirect
- **驗收**: 可用 Google 帳號登入/登出

### Task 12: 免費方案限制
- **Issue**: #26
- **Branch**: `feat/task-12-free-plan`
- **依賴**: Task 4, Task 11
- **子任務**:
  - [ ] 錄音計數邏輯 (3 場/月)
  - [ ] 時長限制 (60 分鐘自動停止)
  - [ ] 升級提示 UI
  - [ ] 用量統計顯示
  - [ ] Edge Function 驗證 (防繞過)
  - [ ] 每月重置
- **驗收**: 第 4 場錄音被擋，顯示升級提示

### Task 13: Chrome Web Store 上架
- **Issue**: #27
- **Branch**: `feat/task-13-store-publish`
- **依賴**: Task 1-12
- **子任務**:
  - [ ] manifest.json 完善
  - [ ] Extension icon (16/32/48/128)
  - [ ] 隱私政策頁面
  - [ ] 截圖製作 (≥3 張)
  - [ ] 宣傳圖片 (440x280)
  - [ ] 權限說明
  - [ ] 提交審核
- **驗收**: 成功提交 Chrome Web Store 審核

### Task 14: E2E 自動化測試
- **Issue**: #28
- **Branch**: `feat/task-14-e2e-tests`
- **依賴**: Task 1-10
- **子任務**:
  - [ ] Playwright 設定
  - [ ] Chrome Extension fixture
  - [ ] TC-001 ~ TC-008 實作
  - [ ] CI 整合
  - [ ] 覆蓋率報告
- **驗收**: CI 自動執行 E2E 測試，全部通過

---

## Sprint 4（Alpha 強化）— 預計 1 週

### Task 15: 麥克風混音
- **Issue**: #51
- **Branch**: `feat/task-15-mic-mixing`
- **依賴**: Task 4
- **子任務**:
  - [ ] getUserMedia 取得麥克風 stream
  - [ ] AudioContext + MediaStreamDestination 混合 tab + mic
  - [ ] 混合後 stream 給 MediaRecorder
  - [ ] 麥克風權限拒絕時 fallback 只錄 tab
  - [ ] UI 顯示麥克風狀態
  - [ ] 音量平衡調整
  - [ ] 單元測試
- **驗收**: 錄音包含雙方聲音，Deepgram 能辨識講者

### Task 16: 修復暫停功能
- **Issue**: #49
- **Branch**: `fix/task-16-pause-recording`
- **依賴**: Task 4
- **子任務**:
  - [ ] 調查 MediaRecorder.pause() 在 offscreen 的行為
  - [ ] 確認 tabCapture stream 暫停時不斷開
  - [ ] 修復狀態同步（background ↔ popup）
  - [ ] 單元測試
- **驗收**: 暫停/繼續正常運作，計時器同步

### Task 17: SSO 前端對接
- **Issue**: #44
- **Branch**: `feat/task-17-sso-ensure-org`
- **依賴**: Task 11, ensure-org Edge Function
- **子任務**:
  - [ ] 登入成功後自動呼叫 ensure-org
  - [ ] 首位登入者自動建組織 + 成為 Admin
  - [ ] UI 顯示組織名稱
  - [ ] 錯誤處理（org 建立失敗）
  - [ ] 單元測試
- **驗收**: 新用戶登入自動建組織，再次登入自動加入

### Task 18: RLS 安全驗證
- **Issue**: #47
- **Branch**: `feat/task-18-rls-verification`
- **依賴**: Task 2
- **子任務**:
  - [ ] 撰寫 RLS 測試（跨用戶存取被拒）
  - [ ] 撰寫 RLS 測試（同組織可互看錄音）
  - [ ] 撰寫 RLS 測試（storage bucket 權限）
  - [ ] CI 整合 RLS 測試
- **驗收**: 所有 RLS 測試通過，跨用戶存取被正確擋住

### Task 19: 分段錄音 + 批次轉錄
- **Issue**: #48
- **Branch**: `feat/task-19-segment-recording`
- **依賴**: Task 4, Task 8
- **子任務**:
  - [ ] 錄音時每 3 分鐘自動切段
  - [ ] 切段後背景上傳 Supabase Storage
  - [ ] 上傳完觸發 transcribe Edge Function
  - [ ] 後端按 segment_index 拼接逐字稿
  - [ ] 講者辨識跨段落銜接
  - [ ] recording_segments 表（如需要）
  - [ ] 網路中斷自動重試
  - [ ] 單元測試 + 整合測試
- **驗收**: 30 分鐘會議錄完 ≤30 秒出完整結果

### Task 20: 錄音列表標題改善
- **Issue**: #50
- **Branch**: `feat/task-20-recording-titles`
- **依賴**: Task 6
- **子任務**:
  - [ ] Google Meet → 提取會議名稱
  - [ ] LINE → 顯示「LINE 通話」
  - [ ] 其他 → 日期時間格式
  - [ ] 使用者可編輯標題
  - [ ] 列表預覽摘要重點
- **驗收**: 列表顯示有意義的標題
