# ⚡ EventPulse GTA

A live event aggregation & interactive calendar for the Greater Toronto Area.

---

## 🚀 How to put this on GitHub Pages (step by step)

### 1. Create a GitHub account
Go to https://github.com and sign up if you haven't already.

### 2. Create a new repository
- Click the **+** button top right → **New repository**
- Name it exactly: `eventpulse`
- Keep it **Public**
- Click **Create repository**

### 3. Upload these files
- Click **uploading an existing file** on the repo page
- Drag and drop ALL the files and folders from this project
- Click **Commit changes**

### 4. Enable GitHub Pages
- Go to your repo → **Settings** → **Pages** (left sidebar)
- Under **Source**, select **GitHub Actions**
- Click **Save**

### 5. Wait ~2 minutes
GitHub will automatically build and deploy your site.
Your live URL will be: `https://YOUR-USERNAME.github.io/eventpulse/`

---

## ⚠️ One thing to change

Open `vite.config.js` and make sure the `base` matches your repo name:

```js
base: '/eventpulse/',   // ← must match your GitHub repo name exactly
```

---

## 💻 Run locally (optional)

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

## 📁 File structure

```
eventpulse/
├── index.html              ← HTML entry point
├── vite.config.js          ← Build config
├── package.json            ← Dependencies
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml      ← Auto-deploys on every push to main
└── src/
    ├── main.jsx            ← React entry point
    └── EventPulse.jsx      ← The whole app
```
