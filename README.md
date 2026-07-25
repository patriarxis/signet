# Signet

[![Vue.js](https://img.shields.io/badge/vue.js-3.x-brightgreen.svg)](https://vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![GitHub repo size](https://img.shields.io/github/repo-size/patriarxis/signet)

A lightweight email signature library. Browse templates, customize them locally, and copy HTML into your email client — no accounts, no cloud.

## Features

- Sidebar form for all signature fields, plus **Reset** to defaults
- Edit names, titles, links, and more directly on each signature
- Select text to format: bold, italic, underline, strikethrough, link (Phosphor toolbar)
- Placeholder text when a field is empty (e.g. “Add name”)
- Preview / HTML code toggle next to copy on each card
- Copy clean signature HTML (placeholders excluded)
- Edits persisted in `localStorage`
- Light / dark theme (app chrome; signatures stay email-safe)

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Built assets use base path `/` (Vercel / custom domain root).
