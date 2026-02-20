# 🐱 MeowMeet

一鍵錄音，AI 自動產出會議摘要的 Chrome Extension。

## 技術棧

- **Frontend**: React + TypeScript + Tailwind CSS
- **Build**: Vite (Chrome Extension multi-entry)
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Deepgram (語音轉文字) + Gemini (摘要生成)

## 開發環境設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製範例檔案並填入實際值：

```bash
cp .env.example .env
cp supabase/.env.example supabase/.env
```

**`.env`** — Chrome Extension 前端用：
| 變數 | 說明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

**`supabase/.env`** — Edge Functions / 後端用：
| 變數 | 說明 |
|------|------|
| `DEEPGRAM_API_KEY` | Deepgram API key (語音轉文字) |
| `GEMINI_API_KEY` | Google Gemini API key (AI 摘要) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### 3. Supabase 本地開發

```bash
npx supabase start
npx supabase db reset  # 套用 migrations
```

### 4. 開發

```bash
npm run dev       # 啟動 Vite dev server
npm run build     # 建置 Chrome Extension
npm run lint      # ESLint 檢查
npm run typecheck # TypeScript 型別檢查
npm run test      # 執行測試
```

### 5. 載入 Extension

1. 執行 `npm run build`
2. 開啟 Chrome → `chrome://extensions/`
3. 開啟「開發人員模式」
4. 點「載入未封裝項目」→ 選擇 `dist/` 資料夾

## 專案結構

```
src/
├── popup/          # Extension popup UI
├── background/     # Service worker
├── content/        # Content script
├── lib/            # 共用函式庫 (Supabase client)
├── types/          # TypeScript 型別定義
└── styles/         # 全域樣式
supabase/
├── migrations/     # Database migrations
└── config.toml     # Supabase 本地設定
docs/               # 專案文件 (PRD, 架構設計等)
```

## License

Private — MeowCloud AI
