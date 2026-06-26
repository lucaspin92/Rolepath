# Rolepath developer notes

## Local architecture

Rolepath is a local-first single-user app.

```text
Browser
  |
  | Vite dev server, port 5173
  v
React app
  |
  | /api proxy
  v
Express API, port 8787
  |
  +-- data.json for applications
  +-- browser localStorage for profile data
  +-- Codex SDK for AI features
```

## Main files

- `server.js` - Express API, job analysis, application CRUD, cover letters, interview questions
- `codex-agent.js` - Codex SDK integration and ChatGPT-auth status checks
- `job-parser.js` - job post extraction and local heuristics
- `resume-parser.js` - PDF/DOCX/DOC resume extraction
- `resume-router.js` - resume upload endpoint
- `opportunity-ai.js` - opportunity copilot logic and safe update sanitization
- `src/App.jsx` - main React app shell and navigation
- `src/AddModal.jsx` - new application workflow
- `src/Detail.jsx` - application detail, cover letter, interview prep, notes
- `src/pages.jsx` - dashboard, applications board, interviews page
- `src/ProfilePage.jsx` - profile and resume import UI
- `src/SettingsPage.jsx` - Codex connection UI
- `scripts/dev-session.js` - local process/session manager

## Environment

Rolepath does not require an OpenAI API key.

Use:

```powershell
npx codex login
```

Choose **Sign in with ChatGPT**.

Optional `.env` values:

```env
PORT=8787
```

## Development workflow

Install:

```powershell
npm install
```

Run:

```powershell
npm run dev
```

Stop stale sessions:

```powershell
npm run stop
```

Test:

```powershell
npm test
```

Build:

```powershell
npm run build
```

## Data files

Do not commit local runtime data.

Ignored files:

- `.env`
- `data.json`
- `.rolepath-session.json`
- `node_modules/`
- `dist/`
- `*.log`

## AI behavior

Rolepath uses Codex via `@openai/codex-sdk`.

Important implementation choices:

- API-key auth is deliberately ignored.
- ChatGPT Codex login is required for AI mode.
- Job analysis has a local fallback.
- Resume files are processed in memory.
- Cover letters are saved immediately after generation.
- The opportunity copilot can update only supported application fields.

## Release checklist

Before pushing a release:

1. Update `package.json`.
2. Update `package-lock.json`.
3. Update the visible app version in `src/lib.jsx`.
4. Run:

   ```powershell
   npm test
   npm run build
   ```

5. Confirm private/runtime files are not staged:

   ```powershell
   git status --short --ignored
   ```

6. Commit and tag:

   ```powershell
   git commit -m "Release Rolepath vX.Y"
   git tag -a vX.Y.Z -m "Rolepath vX.Y"
   git push origin main
   git push origin vX.Y.Z
   ```
