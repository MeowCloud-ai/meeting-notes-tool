# MeowMeet — 開發指引

## 技術棧
- **Frontend**: React + Vite + TypeScript
- **Extension**: Chrome Extension Manifest V3
- **Backend**: Supabase (Auth + Storage + Edge Functions + PostgreSQL)
- **外部 API**: Deepgram (轉錄), Gemini Flash (摘要)
- **測試**: Vitest + Playwright

## 開發規範

### TypeScript
- `strict: true`，不允許 `any`
- 使用 `unknown` + type guard 取代 `any`
- 所有函數必須有明確的回傳型別

### 程式碼風格
- ESLint + Prettier
- 單引號，無分號（Prettier 預設）
- 檔案命名：kebab-case

### 測試
- 每個模組都要有對應的 `.test.ts`
- 使用 Vitest 作為測試框架
- 覆蓋率目標 >80%
- E2E 使用 Playwright

### Git 規範
- Branch: `feat/task-N-description`, `fix/issue-N-description`
- Commit: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- PR 必須通過 CI 才能 merge

### Chrome Extension
- Manifest V3（不使用 Manifest V2 API）
- Service Worker 不可使用 DOM API
- 最小權限原則（只申請必要 permissions）

### Supabase
- 所有 table 必須設定 RLS
- Edge Functions 使用 Deno runtime
- Migration 檔案不可修改已部署的版本，只能新增
