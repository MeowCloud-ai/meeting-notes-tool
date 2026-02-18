# CLAUDE.md — MeowMeet 開發指引

## 專案概述
- **名稱**: MeowMeet
- **類型**: MacBook 桌面應用程式（Electron + TypeScript）
- **目標**: Google Meet 會議期間即時擷取音訊，會後自動產生結構化會議紀錄

## 技術棧
- **框架**: Electron + TypeScript
- **前端**: React（Electron renderer）
- **音訊擷取**: BlackHole 虛擬音訊裝置 + Web Audio API / node-audiorecorder
- **語音轉錄**: 本機 Whisper（whisper.cpp 或 faster-whisper）
- **講者辨識**: pyannote-audio 或 speechbrain（Speaker Diarization）
- **LLM 摘要**: Gemini API（已有 Key）
- **輸出**: Google Docs API + Gmail API（OAuth 2.0）
- **建置**: electron-builder
- **測試**: Vitest

## 開發規範
- TypeScript strict mode
- ESLint + Prettier
- Functional components（React）
- 命名：camelCase（變數/函數）、PascalCase（元件/型別）
- 每個模組都要有對應測試
- 每個 PR 都要有描述 + 關聯 Issue

## 架構重點
- 音訊每 3-5 分鐘切一段，送轉錄 pipeline
- Main process 負責音訊擷取 + 背景處理
- Renderer process 負責 UI 顯示
- 轉錄結果暫存本機，會議結束後統一送 LLM 摘要
- Google OAuth token 存在 Electron secure storage

## 注意事項
- BlackHole 需要使用者手動安裝（提供安裝引導）
- macOS 音訊權限需要使用者授權
- Whisper 模型選 small 或 medium（平衡速度和品質）
- 中文為主要語言，轉錄時指定 language=zh
- 不要把 OAuth credentials commit 到 repo
