# INSTALL-GUIDE.md — MeowMeet 安裝手冊

## 系統需求

| 項目 | 最低需求 | 建議 |
|------|----------|------|
| 作業系統 | macOS 12 (Monterey) | macOS 14 (Sonoma) |
| 記憶體 | 4 GB | 8 GB（Whisper 轉錄需要） |
| 硬碟空間 | 1 GB | 2 GB（含 Whisper 模型） |
| 處理器 | Intel / Apple Silicon | Apple Silicon（轉錄更快） |

## 前置軟體

### 1. BlackHole 虛擬音訊驅動

BlackHole 讓 MeowMeet 能擷取 Google Meet 的音訊。

- **下載**: https://existential.audio/blackhole/
- **選擇**: BlackHole 2ch（免費版即可）
- **安裝步驟**:
  1. 下載 BlackHole 2ch PKG 安裝檔
  2. 雙擊安裝，按照提示完成
  3. 可能需要重新開機
- **驗證**: 
  1. 打開「音訊 MIDI 設定」（Spotlight 搜尋 "Audio MIDI Setup"）
  2. 確認左側列表出現 **BlackHole 2ch**

### 2. 設定多重輸出裝置（關鍵步驟！）

這一步讓你在聽到會議聲音的同時，MeowMeet 也能擷取。

1. 打開「音訊 MIDI 設定」
2. 點左下角 **+** → **建立多重輸出裝置**
3. 勾選：
   - ✅ MacBook Pro 喇叭（或你的耳機）
   - ✅ BlackHole 2ch
4. 將「MacBook Pro 喇叭」設為**主裝置**
5. 打開「系統設定」→「聲音」→「輸出」
6. 選擇剛建立的**多重輸出裝置**

> 💡 這樣做之後，聲音會同時送到你的耳機和 BlackHole（讓 MeowMeet 錄音）

### 3. Node.js（僅開發者需要）

如果你是從原始碼跑：
- **下載**: https://nodejs.org/ （v18 以上）
- **驗證**: `node -v`

## 安裝步驟

### 方式 A：安裝包（推薦）

1. 從 [Releases](https://github.com/MeowCloud-ai/meeting-notes-tool/releases) 下載最新的 `.dmg`
2. 打開 DMG，將 **MeowMeet** 拖到 **Applications** 資料夾
3. 首次開啟時，macOS 可能提示「無法辨識的開發者」：
   - 打開「系統設定」→「隱私與安全性」
   - 找到 MeowMeet → 點「仍然開啟」
4. 授權**麥克風權限**（系統會自動彈出提示）

### 方式 B：從原始碼（開發者）

```bash
git clone https://github.com/MeowCloud-ai/meeting-notes-tool.git
cd meeting-notes-tool
npm install
npm run dev
```

## 首次設定

啟動 MeowMeet 後，會引導你完成：

### Step 1: 選擇音訊輸入
- 從下拉選單選擇 **BlackHole 2ch**
- 點「測試」確認可以收到聲音

### Step 2: 連接 Google 帳號
- 點「連接 Google」
- 在瀏覽器中登入並授權
- 授權項目：Google Docs（建立文件）+ Gmail（寄送摘要）

### Step 3: 設定 Email 收件人
- 輸入會議紀錄要寄送的 Email 地址
- 可以設定多個收件人

### Step 4: 下載語音模型
- 首次使用需下載 Whisper 模型（約 500MB）
- 下載時會顯示進度條
- 只需下載一次

## 驗證安裝成功

1. 開啟 MeowMeet
2. 選擇 BlackHole 2ch 作為輸入
3. 播放任意影片或音訊
4. 確認 MeowMeet 的音量指示器有反應
5. 點「開始錄製」→ 等 30 秒 → 點「停止」
6. 確認有產出轉錄文字

## 升級方式

### 安裝包
下載最新 DMG，覆蓋安裝即可。設定會保留。

### 原始碼
```bash
git pull origin main
npm install
npm run dev
```

## 解除安裝

1. 從 Applications 刪除 MeowMeet
2. 刪除設定：`rm -rf ~/Library/Application\ Support/MeowMeet`
3. （選擇性）移除 BlackHole：到「系統設定」→「隱私與安全性」→「安全性」→ 解除安裝

## 常見安裝問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| 看不到 BlackHole 2ch | 未安裝或需要重開機 | 重新安裝 BlackHole，重開機 |
| 音量指示器沒反應 | 輸出未設成多重輸出裝置 | 重做「設定多重輸出裝置」步驟 |
| 「無法辨識的開發者」 | macOS 安全性限制 | 系統設定 → 隱私 → 仍然開啟 |
| npm install 失敗 | Node.js 版本太舊 | 升級到 v18+ |
| Whisper 模型下載失敗 | 網路問題 | 重試，或手動下載模型檔 |
| Google 授權失敗 | OAuth redirect 問題 | 確認網路連線，重試授權 |
