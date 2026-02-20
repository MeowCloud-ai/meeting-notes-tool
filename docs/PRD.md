# MeowMeet — PRD v2

## 產品概述
**MeowMeet** — Chrome Extension 通話錄音 + AI 摘要

## 技術路線
Chrome Extension (React + Vite + TS) + Supabase Backend

## 核心功能

| ID | 功能 | 說明 |
|----|------|------|
| F1 | 一鍵錄音 | tabCapture API，點擊即錄 |
| F2 | 音訊處理 | WebM/Opus 編碼 + Supabase Storage 上傳 |
| F3 | 語音轉錄 | Deepgram API，中文 + Speaker Diarization，$0.25/hr |
| F4 | AI 摘要 | Gemini Flash：重點結論 + Action Items + 關鍵對話 |
| F5 | Extension UI | Popup 控制 + 歷史列表 + 逐字稿 + 摘要 |
| F6 | 用戶系統 | Google OAuth，Free: 3 場/月 |

## 定價方案

| 方案 | 價格 | 錄音場次 | 時長上限 | 功能 |
|------|------|----------|----------|------|
| Free | $0 | 3 場/月 | 60 分鐘 | 基本錄音 + 轉錄 + 摘要 |
| Starter | NT$399/月 | 30 場/月 | 120 分鐘 | + 匯出 + 搜尋 |
| Pro | NT$999/月 | 無限 | 180 分鐘 | + 自訂模板 + API |
| Business | NT$1,499/月 | 無限 | 無限 | + 團隊空間 + 管理後台 |

## 成本估算
- 每小時錄音成本：~NT$8.3
  - Deepgram: ~$0.25/hr
  - Gemini Flash: ~$0.01/hr
  - Supabase Storage: negligible

## Phase 1 目標
- 安裝數：100+
- 活躍用戶：50+
- 錄音成功率：>95%
- 中文轉錄準確率：>90%

## 系統架構

```
Chrome Extension (React + Vite + TS)
    │ tabCapture → MediaRecorder → Upload
    ▼
Supabase Backend
    ├── Auth (Google OAuth)
    ├── Storage (音檔)
    ├── Edge Functions (Deepgram + Gemini)
    └── PostgreSQL
```

## Sprint 計畫

| Sprint | 天數 | 目標 |
|--------|------|------|
| Sprint 0 | 1 天 | 骨架 + Schema |
| Sprint 1 | 5 天 | 錄音功能 |
| Sprint 2 | 5 天 | 轉錄 + 摘要 |
| Sprint 3 | 4 天 | 用戶系統 + 上架 |

**總計：15 天**

## Phase 2 Backlog
- 付費方案實作（Stripe 整合）
- MeowCRM 智慧歸檔
- 團隊空間
- 自訂摘要模板
- Email 通知（會議摘要自動寄送）
