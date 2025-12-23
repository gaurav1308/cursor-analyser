# 🚀 Cursor AI Analyzer

A stunning cyberpunk-themed analytics dashboard that visualizes your **Cursor AI usage** — works on **any Mac** with Cursor installed!

<img width="1470" alt="Screenshot 2025-01-06 at 12 00 00 AM" src="https://github.com/user-attachments/assets/cursor-ai-analyzer-preview.png">

## ✨ Features

- **📊 Real Data Analytics** - Extracts YOUR actual Cursor usage from local databases
- **💬 Full History** - Chat messages, composer sessions, code blocks
- **📈 Beautiful Charts** - Activity timelines, language distribution, heatmaps
- **🗓️ Date Range Filter** - Filter by day, week, month, or all time
- **📤 Import/Export** - Share your stats or analyze on different machines
- **🎨 Cyberpunk Aesthetic** - Stunning neon-themed UI

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/gaurav1308/cursor-analyser.git
cd cursor-analyser
npm install
```

### 2. Extract Your Cursor Data
```bash
./scripts/extract-data.sh 2>/dev/null > public/cursor-usage-data.json
```
> ⚠️ **Important:** This step is required! The data file is not included in the repo for privacy.

### 3. Start Dashboard
```bash
npm run dev
```

### 4. Open Browser
Navigate to **http://localhost:5173** 🎉

---

## 💻 System Requirements

| Requirement | Details |
|-------------|---------|
| **OS** | macOS (any version) |
| **Cursor** | Must be installed with usage history |
| **Node.js** | v18+ recommended |
| **sqlite3** | Pre-installed on macOS |

---

## 📂 Cursor Data Locations (macOS)

The script automatically reads from these locations:

```
~/.cursor/ai-tracking/ai-code-tracking.db     # AI code tracking
~/Library/Application Support/Cursor/User/globalStorage/state.vscdb  # Conversations
```

These paths work on **any Mac** — just clone and run!

---

## 📊 What Gets Extracted

| Data | Source |
|------|--------|
| **Code blocks** | AI-generated code snippets |
| **Conversations** | Composer/chat sessions |
| **Messages** | Individual chat bubbles |
| **Timestamps** | When you coded with AI |
| **Languages** | File extensions used |
| **Files** | Which files were modified |

---

## 🔄 Refresh Your Data

Run anytime to get latest stats:

```bash
./scripts/extract-data.sh 2>/dev/null > public/cursor-usage-data.json
```

Then refresh the browser!

---

## 📤 Share Your Stats

Generate a portable data file:

```bash
./scripts/extract-data.sh 2>/dev/null > my-cursor-stats.json
```

Then share the JSON file or upload it via the dashboard's **"Import Data"** button!

---

## 📁 Project Structure

```
cursor-analyser/
├── public/
│   ├── cursor-usage-data.json  # Your data (generated, not in repo)
│   └── cursor.svg
├── scripts/
│   └── extract-data.sh         # Data extraction (macOS)
├── src/
│   ├── components/             # React components
│   │   ├── Dashboard.jsx
│   │   ├── ActivityChart.jsx
│   │   ├── DateRangeSelector.jsx
│   │   └── ...
│   └── utils/
│       └── dataParser.js       # Data transformation
├── package.json
├── .gitignore
└── README.md
```

---

## 🎨 Customize Theme

Edit `src/index.css`:

```css
:root {
  --neon-cyan: #00f5ff;
  --neon-green: #00ff88;
  --neon-purple: #bf00ff;
}
```

---

## 🛠️ Tech Stack

- **React 18** + **Vite** — Fast development
- **Framer Motion** — Smooth animations
- **Recharts** — Data visualizations
- **Lucide Icons** — Beautiful icons

---

## 🔒 Privacy

Your Cursor usage data stays **local** and is **never uploaded** anywhere. The extraction script only reads from your local Cursor databases. The generated JSON file is excluded from git via `.gitignore`.

---

## 📜 License

MIT License — use it however you like!

---

Built with ⚡ using Cursor AI
