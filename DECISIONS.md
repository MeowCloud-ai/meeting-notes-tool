# MeowMeet — Architecture Decision Records

## ADR-001: Electron → Chrome Extension

**日期**: 2025-02-21
**狀態**: Accepted

**背景**: 原本計劃使用 Electron 桌面應用，但考量到開發速度和使用場景。

**決定**: 改用 Chrome Extension (Manifest V3)

**原因**:
- 跨平台：Chrome 瀏覽器即可使用，無需安裝桌面應用
- 開發速度：Extension 開發週期比 Electron 短
- LINE Web 支援：Extension 可直接在瀏覽器頁面運作
- 部署簡單：Chrome Web Store 一鍵安裝
- tabCapture API：Chrome 原生支持分頁音訊擷取

**取捨**: 失去系統音訊存取（只能錄分頁音訊），但會議場景以瀏覽器為主，影響不大。

---

## ADR-002: Whisper → Deepgram

**日期**: 2025-02-21
**狀態**: Accepted

**背景**: 原本計劃使用 OpenAI Whisper，但評估後發現 Deepgram 更適合。

**決定**: 使用 Deepgram Nova-2 作為語音轉錄引擎

**原因**:
- Speaker Diarization 內建：Whisper 需額外整合 pyannote
- 中文品質：Nova-2 中文轉錄品質優異
- 成本：$0.25/hr，比 Whisper API ($0.36/hr) 便宜
- 即時性：支援 streaming（未來可做即時轉錄）
- API 穩定：SLA 99.9%

**取捨**: Deepgram 是第三方服務，有 vendor lock-in 風險。但成本和功能優勢明顯。

---

## ADR-003: Supabase 全家桶

**日期**: 2025-02-21
**狀態**: Accepted

**背景**: 需要 Auth、Storage、Database、Serverless Functions。

**決定**: 全部使用 Supabase 生態系

**原因**:
- 一站式：Auth + Storage + Edge Functions + PostgreSQL，不需拼裝
- 開發速度：Supabase CLI 本地開發 + Migration 管理
- 成本：Free tier 足夠 Phase 1
- RLS：Row Level Security 內建，安全性有保障
- 即時訂閱：Realtime 可用於狀態同步

**取捨**: 與 Supabase 深度綁定。但 PostgreSQL 是開放標準，遷移成本可控。

---

## ADR-004: Gemini Flash for 摘要

**日期**: 2025-02-21
**狀態**: Accepted

**背景**: 需要 AI 模型產出會議摘要。

**決定**: 使用 Google Gemini 2.0 Flash

**原因**:
- 速度快：Flash 模型回應速度快
- 中文佳：Google 中文訓練資料豐富
- 成本低：比 GPT-4 便宜 10 倍以上
- Structured output：支援 JSON schema 輸出
- 長 context：100K+ tokens，長會議也能處理

**取捨**: 摘要品質可能略遜於 GPT-4，但在會議摘要場景差異不大，且成本優勢明顯。

## ADR-005: 分段批次轉錄（非即時串流）
- **日期**: 2026-02-27
- **決策**: 採用每 3 分鐘切段 + 批次上傳轉錄，不做 YouTube 式 Streaming ASR
- **原因**: 不需即時字幕/即時建議，批次更簡單、便宜、準確度高
- **參數**: 3 分鐘為起始值，後續實測可往下壓（甜蜜點可能 1.5-2 分鐘）
- **影響**: 錄完 ≤30 秒出完整結果

## ADR-006: 麥克風 + Tab 混音
- **日期**: 2026-02-27
- **決策**: 用 AudioContext 混合 tabCapture（對方聲音）+ getUserMedia（本地麥克風）
- **原因**: tabCapture 只錄分頁輸出，不含使用者自己的聲音
- **Fallback**: 麥克風權限被拒時只錄 tab 音訊，不阻斷流程

## ADR-007: Build Pipeline — post-build.sh
- **日期**: 2026-02-27
- **決策**: 加入 post-build.sh 腳本修正 dist/manifest.json 路徑
- **原因**: Vite build 不自動處理 manifest.json，src 路徑需改為 build 後的 .js 檔名
- **影響**: `npm run build` 後必須跑 `bash scripts/post-build.sh`
