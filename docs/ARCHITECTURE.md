# MeowMeet — 系統架構

## 架構總覽

```
┌─────────────────────────────────────────┐
│         Chrome Extension (MV3)          │
│  ┌──────────┐ ┌───────────┐ ┌────────┐ │
│  │  Popup   │ │ Background│ │Content │ │
│  │  (React) │ │ Service   │ │ Script │ │
│  │          │ │ Worker    │ │        │ │
│  └────┬─────┘ └─────┬─────┘ └───┬────┘ │
│       │   message    │           │      │
│       └──────────────┘           │      │
└──────────────┬───────────────────┘      │
               │ HTTPS                     
               ▼                           
┌─────────────────────────────────────────┐
│           Supabase Backend              │
│  ┌────────┐ ┌─────────┐ ┌───────────┐  │
│  │  Auth   │ │ Storage │ │   Edge    │  │
│  │(Google) │ │ (音檔)  │ │ Functions │  │
│  └────────┘ └─────────┘ └─────┬─────┘  │
│  ┌─────────────────────────────┘        │
│  │  PostgreSQL                          │
│  │  ├── users                           │
│  │  ├── recordings                      │
│  │  ├── transcripts                     │
│  │  └── summaries                       │
│  └──────────────────────────────────────│
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼                     ▼
┌─────────┐        ┌──────────┐
│Deepgram │        │ Gemini   │
│ (轉錄)  │        │ (摘要)   │
└─────────┘        └──────────┘
```

## Extension 層

### Popup (React)
- 錄音控制面板（開始/暫停/停止）
- 錄音歷史列表
- 逐字稿 + 摘要檢視
- 用量統計 + 登入狀態

### Background Service Worker
- `chrome.tabCapture.capture()` 管理
- `MediaRecorder` 錄音（WebM/Opus）
- 5 分鐘分段 + 即時上傳 Supabase Storage
- IndexedDB 暫存未上傳片段
- Badge 狀態管理

### Content Script
- 合規提示注入（錄音通知）
- 頁面內錄音指示器

## Supabase 層

### Auth
- Google OAuth (chrome.identity API → signInWithIdToken)

### Storage
- `recordings` bucket（私有）
- 路徑：`{user_id}/{recording_id}/{segment_N}.webm`

### Edge Functions
- `transcribe/`：接收音檔 → Deepgram Nova-2 → 逐字稿
- `summarize/`：接收逐字稿 → Gemini Flash → 摘要

### PostgreSQL
- RLS：用戶只能存取自己的資料
- Storage trigger → 自動觸發轉錄

## 目錄結構

```
meowmeet/
├── src/
│   ├── popup/          # React Popup UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── background/     # Service Worker
│   │   ├── index.ts
│   │   ├── recorder.ts
│   │   └── uploader.ts
│   ├── content/        # Content Script (合規提示)
│   │   └── index.ts
│   ├── lib/            # 共用邏輯
│   │   ├── supabase.ts
│   │   ├── recorder.ts
│   │   └── api.ts
│   └── types/
│       └── index.ts
├── supabase/
│   ├── migrations/     # DB Schema
│   │   └── 001_init.sql
│   └── functions/      # Edge Functions
│       ├── transcribe/
│       │   └── index.ts
│       └── summarize/
│           └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
│   └── icons/
├── manifest.json
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## 資料流

1. **錄音**：User click → tabCapture → MediaRecorder → 5min segments → Supabase Storage
2. **轉錄**：Storage trigger → Edge Function → Deepgram API → transcripts table
3. **摘要**：Transcript ready → Edge Function → Gemini Flash → summaries table
4. **檢視**：Popup → Supabase query → 顯示逐字稿/摘要
