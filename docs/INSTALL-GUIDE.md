# 安裝指南

## 從 Chrome Web Store 安裝

1. 前往 Chrome Web Store 搜尋 **MeowMeet**
2. 點擊「加到 Chrome」
3. 授權 Google 帳號登入
4. 開始使用！

## 從原始碼安裝（開發者）

### 前置需求

- Node.js 20+
- npm 10+
- Chrome 瀏覽器

### 步驟

```bash
git clone https://github.com/MeowCloud-ai/meeting-notes-tool.git
cd meeting-notes-tool
cp .env.example .env   # 填入你的 API keys
npm install
npm run build
```

1. 開啟 Chrome → `chrome://extensions/`
2. 啟用右上角「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇專案的 `dist/` 資料夾

### 環境變數設定

| 變數 | 說明 | 必填 |
|------|------|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名金鑰 | ✅ |
| `VITE_DEEPGRAM_API_KEY` | Deepgram API 金鑰 | ✅ |
| `VITE_GEMINI_API_KEY` | Google Gemini API 金鑰 | ✅ |

### Supabase 設定

1. 建立 Supabase 專案
2. 執行 `supabase/migrations/` 下的 SQL
3. 設定 Google OAuth Provider
4. 啟用 Storage bucket `recordings`
