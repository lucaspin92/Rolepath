# Rolepath

Rolepath is a private, local-first workspace for managing job applications. Paste a job link or description and Rolepath turns it into structured role notes, a saved cover letter draft, interview preparation, and an application pipeline.

Version: **1.0**

## Features

- Kanban application board with drag-and-drop stages
- Application deletion with native in-app confirmation dialogs
- Job post analysis from a URL or pasted description
- Live analysis progress while the agent works
- Original job link and description saved behind a collapsible detail section
- Resume import from PDF, DOCX, and legacy DOC
- Profile auto-fill from resume content, with manual editing for missing fields
- Saved cover letter generation with PDF export
- Interview question generation and saved draft answers
- Multi-phase interview tracking
- Opportunity copilot powered by local Codex authentication
- Local fallback extraction when Codex is unavailable

## Requirements

- Node.js 20 or newer
- npm
- A local Codex login if you want AI features

Rolepath intentionally does **not** use an OpenAI API key. It uses the Codex CLI/SDK with your local ChatGPT sign-in.

## Quick start

Clone the repository:

```powershell
git clone https://github.com/lucaspin92/Rolepath.git
cd Rolepath
```

Install dependencies:

```powershell
npm install
```

Connect Codex:

```powershell
npx codex login
```

Choose **Sign in with ChatGPT**.

Start Rolepath:

```powershell
npm run dev
```

Open the app:

[http://127.0.0.1:5173](http://127.0.0.1:5173)

The local API runs at:

[http://localhost:8787](http://localhost:8787)

## Useful commands

```powershell
npm run dev
```

Starts the local API and Vite frontend through Rolepath's dev session manager.

```powershell
npm run stop
```

Stops stale Rolepath API/frontend processes if a previous session closed unexpectedly.

```powershell
npm test
```

Runs the automated tests.

```powershell
npm run build
```

Creates a production build in `dist/`.

```powershell
npm start
```

Starts the Express API. With `NODE_ENV=production`, it also serves the built frontend.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Developer notes](docs/DEVELOPMENT.md)

## Data and privacy

Rolepath is designed as a single-user local app.

- The repository is intentionally a blank application template.
- No user jobs, resumes, tokens, Codex credentials, or local session data are committed.
- Applications are stored locally in `data.json`.
- Your profile is stored in browser local storage.
- Uploaded resumes are processed in memory. Original files are not stored.
- Temporary rendered resume pages are deleted after extraction.
- Codex authentication is managed locally by Codex. Rolepath does not store credentials.
- Job URLs are checked to avoid fetching private/local network addresses.
- Generated content should always be reviewed before use.

The following local/runtime files are intentionally ignored by git:

- `.env`
- `.env.*`, except `.env.example`
- `data.json`
- `.rolepath-session.json`
- `node_modules/`
- `dist/`

## How another user connects the agent

Each user runs Rolepath locally and signs in to Codex on their own computer:

```powershell
npx codex login
```

They should choose **Sign in with ChatGPT**. Their Rolepath AI requests use their own Codex/ChatGPT account allowance. No shared API key is required.

## Stack

- React
- Vite
- Express
- Codex SDK
- Local JSON storage
- `pdf-parse`, `mammoth`, and `word-extractor` for resume extraction
- `jspdf` for cover letter PDF export
