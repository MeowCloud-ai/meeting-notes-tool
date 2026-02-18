# ARCHITECTURE.md — MeowMeet 技術架構

## 系統架構圖

```
┌─────────────────────────────────────────────────────┐
│                    Electron App                      │
│                                                      │
│  ┌──────────────┐     ┌──────────────────────────┐  │
│  │  Renderer     │     │  Main Process             │  │
│  │  (React UI)   │     │                           │  │
│  │               │     │  ┌─────────────────────┐  │  │
│  │  - 控制面板    │ IPC │  │  Audio Capture       │  │  │
│  │  - 狀態顯示    │◄───►│  │  (BlackHole input)   │  │  │
│  │  - 設定頁面    │     │  └──────────┬──────────┘  │  │
│  │  - 歷史紀錄    │     │             ↓              │  │
│  │               │     │  ┌─────────────────────┐  │  │
│  └──────────────┘     │  │  Audio Chunker       │  │  │
│                        │  │  (每 3-5 分鐘切段)    │  │  │
│                        │  └──────────┬──────────┘  │  │
│                        │             ↓              │  │
│                        │  ┌─────────────────────┐  │  │
│                        │  │  Transcription       │  │  │
│                        │  │  (Whisper local)     │  │  │
│                        │  └──────────┬──────────┘  │  │
│                        │             ↓              │  │
│                        │  ┌─────────────────────┐  │  │
│                        │  │  Speaker Diarize     │  │  │
│                        │  │  (v0.2)              │  │  │
│                        │  └──────────┬──────────┘  │  │
│                        │             ↓              │  │
│                        │  ┌─────────────────────┐  │  │
│                        │  │  Segment Store       │  │  │
│                        │  │  (本機暫存)           │  │  │
│                        │  └──────────┬──────────┘  │  │
│                        │             ↓ (會議結束)    │  │
│                        │  ┌─────────────────────┐  │  │
│                        │  │  LLM Summarizer      │  │  │
│                        │  │  (Gemini API)        │  │  │
│                        │  └──────────┬──────────┘  │  │
│                        │             ↓              │  │
│                        │  ┌─────────────────────┐  │  │
│                        │  │  Output Manager      │  │  │
│                        │  │  ├── Google Docs API  │  │  │
│                        │  │  └── Gmail API        │  │  │
│                        │  └─────────────────────┘  │  │
│                        └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 模組設計

### 1. Audio Capture (`src/main/audio/`)
- 使用 `node-audiorecorder` 或 Node.js `child_process` 呼叫 `sox`/`ffmpeg`
- 輸入源：BlackHole 虛擬音訊裝置
- 格式：WAV 16kHz mono（Whisper 最佳輸入）
- 職責：開始/停止錄音、音量監測

### 2. Audio Chunker (`src/main/chunker/`)
- 每 3-5 分鐘（可設定）切一段
- 切段時避免切在句子中間（靜音偵測）
- 輸出：暫存 WAV 檔案

### 3. Transcription Engine (`src/main/transcription/`)
- 包裝 whisper.cpp（透過 node-addon 或 child_process）
- 或用 Python subprocess 呼叫 faster-whisper
- 參數：language=zh, model=small
- 輸出：帶時間戳的文字段落

### 4. Speaker Diarization (`src/main/diarization/`) — v0.2
- 使用 pyannote-audio（Python subprocess）
- 輸入：WAV 音檔
- 輸出：時間段 + 講者標籤
- 與轉錄結果合併

### 5. Segment Store (`src/main/store/`)
- 本機 SQLite 或 JSON 檔案
- 儲存每段的：時間、轉錄文字、講者、狀態
- 支援會議歷史查詢

### 6. LLM Summarizer (`src/main/summarizer/`)
- 彙整所有段落的轉錄文字
- 呼叫 Gemini API 生成結構化摘要
- Prompt 模板：
  ```
  你是會議紀錄助手。根據以下逐字稿，產出：
  1. 會議摘要（3-5 句）
  2. 行動項目清單（格式：- [ ] [負責人] [事項] [期限]）
  3. 決策紀錄
  4. 關鍵討論點
  ```

### 7. Output Manager (`src/main/output/`)
- **Google Docs**: 使用 googleapis SDK，建立文件、套用模板
- **Gmail**: 使用 googleapis SDK，寄送摘要 Email
- **OAuth**: 使用 Electron 的 BrowserWindow 做 OAuth flow

## 目錄結構

```
meeting-notes-tool/
├── CLAUDE.md
├── DECISIONS.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── TASKS.md
├── .claude/
│   └── agents/
│       ├── coder.md
│       └── reviewer.md
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── feature.md
│       └── bug.md
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # Entry point
│   │   ├── audio/
│   │   │   ├── capture.ts       # 音訊擷取
│   │   │   └── chunker.ts       # 分段器
│   │   ├── transcription/
│   │   │   └── whisper.ts       # Whisper 包裝
│   │   ├── diarization/
│   │   │   └── speaker.ts       # 講者辨識 (v0.2)
│   │   ├── summarizer/
│   │   │   └── gemini.ts        # LLM 摘要
│   │   ├── output/
│   │   │   ├── googleDocs.ts    # Google Docs 輸出
│   │   │   └── email.ts         # Email 輸出
│   │   ├── store/
│   │   │   └── segments.ts      # 段落暫存
│   │   └── auth/
│   │       └── google.ts        # OAuth 管理
│   ├── renderer/                # Electron Renderer (React)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx # 開始/停止/暫停
│   │   │   ├── StatusBar.tsx    # 錄音狀態
│   │   │   ├── Settings.tsx     # 設定頁面
│   │   │   └── History.tsx      # 歷史紀錄
│   │   └── hooks/
│   │       └── useRecording.ts
│   └── shared/
│       └── types.ts             # 共用型別
├── scripts/
│   └── setup-whisper.sh         # Whisper 模型下載
├── package.json
├── tsconfig.json
├── electron-builder.yml
└── vitest.config.ts
```

## 技術依賴

| 套件 | 用途 |
|------|------|
| electron | 桌面框架 |
| react + react-dom | UI |
| googleapis | Google Docs + Gmail API |
| @electron/remote | Main/Renderer 溝通 |
| better-sqlite3 | 本機資料存儲 |
| fluent-ffmpeg | 音訊處理 |
| electron-builder | 打包發布 |
| vitest | 測試 |
| eslint + prettier | 程式碼品質 |
