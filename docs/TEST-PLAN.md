# MeowMeet — 測試計劃

## 測試策略 — 自動化迴圈驗證設計

| 層級 | 工具 | 覆蓋率目標 | 說明 |
|------|------|------------|------|
| 單元測試 | Vitest | >80% | 每個模組獨立測試 |
| 整合測試 | Vitest + MSW | 關鍵流程 | API mock + 模組協作 |
| E2E 測試 | Playwright + chrome-extension-testing | 核心場景 | 完整使用者流程 |
| CI 迴圈 | GitHub Actions | 每 PR | Build → Lint → TypeCheck → Test → E2E |

## 自動化迴圈驗證機制

1. **每個 PR 必須通過全部自動化測試才能 merge**
2. **E2E 測試使用 Playwright 驅動 Chrome Extension：**
   - 安裝 Extension → 點擊錄音 → 驗證上傳 → 觸發轉錄 → 驗證摘要產出
3. **整合測試用 MSW mock 外部 API**（Deepgram/Gemini），確保不依賴外部服務
4. **CI Pipeline 失敗 → 自動 Request Changes → Coding Agent 修復 → 重新跑**
5. **覆蓋率下降 → CI 失敗，不允許 merge**

## 測試案例

### TC-001: 錄音啟動/暫停/停止流程
- **前置**：Extension 已安裝，用戶已登入
- **步驟**：
  1. 開啟 Google Meet 頁面
  2. 點擊 Extension icon → 點擊「開始錄音」
  3. 確認合規提示 → 點擊「確認」
  4. 驗證 badge 顯示錄音狀態
  5. 點擊「暫停」→ 驗證暫停狀態
  6. 點擊「繼續」→ 驗證恢復錄音
  7. 點擊「停止」→ 驗證錄音結束
- **預期**：錄音檔案成功產生，badge 狀態正確切換

### TC-002: 音訊分段（5 分鐘）+ 上傳
- **步驟**：模擬 6 分鐘錄音
- **預期**：產生 2 個分段，均成功上傳至 Supabase Storage

### TC-003: Deepgram 轉錄結果解析
- **步驟**：上傳測試音檔 → 觸發 Edge Function
- **預期**：回傳正確 JSON 格式，包含 text、speakers、timestamps

### TC-004: Gemini 摘要格式驗證
- **步驟**：傳入測試逐字稿 → 觸發 Edge Function
- **預期**：回傳包含 highlights、action_items、key_dialogues 的 JSON

### TC-005: Google OAuth 登入流程
- **步驟**：點擊登入 → Google OAuth 流程 → 回到 Extension
- **預期**：用戶資訊正確顯示，Supabase Auth session 建立

### TC-006: 免費方案限制（第 4 場被擋）
- **步驟**：模擬已錄 3 場 → 嘗試第 4 場
- **預期**：顯示升級提示，無法開始錄音

### TC-007: 離線/斷網容錯
- **步驟**：錄音中斷開網路 → 恢復網路
- **預期**：錄音不中斷，暫存片段在恢復後自動上傳

### TC-008: 多分頁同時錄音防衝突
- **步驟**：在 Tab A 錄音中 → 嘗試在 Tab B 開始錄音
- **預期**：提示已有錄音進行中，拒絕第二個錄音請求

## CI Pipeline 設定

```yaml
# 每個 PR 觸發
on: [pull_request]

jobs:
  test:
    steps:
      - Build
      - Lint (ESLint)
      - TypeCheck (tsc --noEmit)
      - Unit Test (vitest run --coverage)
      - E2E Test (playwright test)
    
    # 覆蓋率門檻
    coverage:
      branches: 80
      functions: 80
      lines: 80
      statements: 80
```

## Mock 策略

| 外部服務 | Mock 方式 | 用於 |
|----------|-----------|------|
| Deepgram API | MSW handler | 整合測試 |
| Gemini API | MSW handler | 整合測試 |
| Supabase | Supabase local (Docker) | 整合/E2E |
| Chrome APIs | @anthropic-ai/chrome-extension-testing | E2E |
