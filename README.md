# 🐱 MeowMeet

> AI-powered Google Meet meeting notes generator

一鍵開始，會後 3 分鐘收到完整會議紀錄。

## Features

- 🎙️ 即時擷取 Google Meet 音訊（透過 BlackHole）
- 📝 本機 Whisper 語音轉錄（中文優化）
- 🤖 AI 智慧摘要（Gemini）
- 📄 自動輸出到 Google Docs
- 📧 Email 通知摘要

## Prerequisites

- macOS
- [BlackHole](https://existential.audio/blackhole/) audio driver
- Google Account (for Docs + Gmail)

## Development

```bash
npm install
npm run dev
```

## Tech Stack

- Electron + TypeScript + React
- Whisper (local transcription)
- Gemini API (summarization)
- Google APIs (Docs + Gmail)

## License

MIT © MeowCloud-ai
