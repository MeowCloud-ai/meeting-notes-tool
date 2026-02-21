# 🐱 MeowMeet

> 一鍵錄音，AI 自動產出會議摘要

MeowMeet 是一個 Chrome Extension，讓你在任何瀏覽器會議中一鍵錄音，自動產出逐字稿與 AI 摘要。

## ✨ 功能

- 🎤 **一鍵錄音** — 透過 Chrome tabCapture 錄製會議音訊
- 📝 **自動轉錄** — 使用 Deepgram 語音辨識產出逐字稿
- 🤖 **AI 摘要** — Google Gemini 自動產出會議重點、待辦事項
- ☁️ **雲端同步** — 錄音與摘要自動上傳 Supabase
- 📴 **離線支援** — 斷網時自動暫存，恢復後同步
- 🔒 **Google 登入** — 安全的 OAuth 認證

## 📸 截圖

<!-- TODO: Add screenshots -->

## 🚀 安裝

### 從 Chrome Web Store（即將推出）

1. 前往 Chrome Web Store 搜尋 "MeowMeet"
2. 點擊「加到 Chrome」

### 從原始碼安裝

```bash
git clone https://github.com/MeowCloud-ai/meeting-notes-tool.git
cd meeting-notes-tool
npm install
npm run build
```

1. 開啟 Chrome，前往 `chrome://extensions/`
2. 啟用「開發人員模式」
3. 點擊「載入未封裝項目」→ 選擇 `dist/` 資料夾

## 🛠️ 開發

```bash
npm install          # 安裝依賴
npm run dev          # 開發模式
npm run build        # 建置
npm run lint         # 程式碼檢查
npm run test         # 執行測試
npm run test:e2e     # E2E 測試
```

### 環境變數

建立 `.env` 檔案：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEEPGRAM_API_KEY=your_deepgram_key
VITE_GEMINI_API_KEY=your_gemini_key
```

## 🏗️ 技術架構

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build**: Vite 7
- **Extension**: Chrome Manifest V3
- **Backend**: Supabase (Auth + Database + Storage)
- **AI**: Deepgram (STT) + Google Gemini (Summary)
- **Testing**: Vitest + Playwright

## 📄 License

MIT

## 🔗 相關文件

- [安裝指南](docs/INSTALL-GUIDE.md)
- [使用指南](docs/USER-GUIDE.md)
- [更新日誌](docs/CHANGELOG.md)
- [隱私政策](docs/privacy-policy.html)
