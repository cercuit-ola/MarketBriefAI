# 📊 The Market Brief — Vercel Edition

A React + Vite app with Vercel Serverless Functions that:
- Generates daily market briefings via **Anthropic / Gemini / DeepSeek**
- Emails a beautiful HTML digest to any address
- **Fires automatically at 9AM WAT every day** using Vercel Cron

---

## 📁 File Structure

```
market-brief/
├── api/
│   ├── generate.js    ← POST /api/generate  — preview briefing in UI
│   ├── send.js        ← POST /api/send       — generate + send email now
│   └── cron.js        ← GET  /api/cron       — called by Vercel at 9AM daily
├── src/
│   ├── App.jsx        ← Full React UI
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json        ← Cron schedule config (8AM UTC = 9AM WAT)
```

---

## 🚀 Deploy to Vercel (5 minutes)

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd market-brief
npm install
vercel deploy --prod
```

### Option B — GitHub + Vercel Dashboard

1. Push this folder to a GitHub repo
2. Go to **vercel.com** → New Project → Import your repo
3. Framework: **Vite**
4. Click **Deploy**

---

## 🔑 Environment Variables

After deploying, go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

| Variable | Value | Required for |
|---|---|---|
| `CRON_SECRET` | any random string, e.g. `mySecret42` | Cron security |
| `SMTP_USER` | your Gmail address | Sending email |
| `SMTP_PASS` | Gmail App Password (16 chars) | Sending email |
| `SUBSCRIBERS` | JSON array (see below) | Daily cron emails |

### SUBSCRIBERS format
```json
[
  {
    "email": "you@example.com",
    "provider": "gemini",
    "apiKey": "AIzaSy..."
  },
  {
    "email": "friend@example.com",
    "provider": "anthropic",
    "apiKey": "sk-ant-..."
  }
]
```

> Add as many subscribers as you want — each can use a different AI provider.

---

## 📧 Getting a Gmail App Password

Regular Gmail passwords don't work. You need an **App Password**:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → **2-Step Verification** (must be ON)
3. Search for **App Passwords** at the top
4. Select app: **Mail** → Generate
5. Copy the 16-character password (spaces don't matter)

---

## 🤖 Free AI Options

| Provider | Key | Free Tier |
|---|---|---|
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com) | ✅ 1,500 requests/day FREE |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | ✅ ~$0.14/1M tokens |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com) | $5 free credit |

**Recommended: Gemini Flash** — free, fast, excellent for this use case.

---

## ⏰ How the 9AM Email Works

`vercel.json` sets:
```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 8 * * *" }]
}
```

- `0 8 * * *` = 8AM UTC = **9AM West Africa Time (WAT)**
- Vercel hits `GET /api/cron` with your `CRON_SECRET` in the Authorization header
- The cron function reads `SUBSCRIBERS` env var, generates one briefing per subscriber, sends emails

> ⚠️ Vercel Cron requires the **Hobby plan or higher** (free tier supports 2 cron jobs)

---

## 💻 Local Development

```bash
npm install
npm run dev          # React UI at http://localhost:5173

# In another terminal (to test API routes locally):
npx vercel dev       # Runs both frontend + serverless functions
```

When running locally with `vercel dev`, API calls to `/api/generate` etc. work automatically.

---

## 📡 API Routes

### `POST /api/generate`
Generate a briefing for preview in the UI.
```json
{ "provider": "gemini", "apiKey": "AIza..." }
```

### `POST /api/send`
Generate + immediately send email.
```json
{
  "email": "you@example.com",
  "provider": "gemini",
  "apiKey": "AIza...",
  "smtpUser": "sender@gmail.com",
  "smtpPass": "xxxx xxxx xxxx xxxx"
}
```

### `GET /api/cron`
Called automatically by Vercel at 9AM. Requires `Authorization: Bearer YOUR_CRON_SECRET` header.

---

*Not financial advice. Always do your own research.*
# MarketBriefAI
