# Rolepath

Rolepath is a private, local-first workspace for job applications. Paste a job link or description and it turns the posting into structured notes, a saved cover-letter draft, and realistic interview preparation.

## What it includes

- Kanban application pipeline with drag-and-drop stages, search, and deletion
- Resume import for PDF, DOCX, and legacy DOC with automatic profile population
- Job-link ingestion with server-side fetching and private-network protection
- Structured role details, requirements, skills, benefits, fit signals, and gaps
- Saved cover letters grounded in your profile and the job post
- A Codex opportunity copilot that can discuss and update role details, cover letters, questions, and answers
- Multiple interview rounds and role-specific interview preparation
- Local fallback tools when Codex is not connected

## Run it

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Connect Codex using your ChatGPT account:

   ```powershell
   npx codex login
   ```

   Choose **Sign in with ChatGPT**. Rolepath deliberately ignores API-key authentication.

3. Start Rolepath:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:5173`. The Settings screen shows the Codex connection and setup instructions.

To create a production build, run `npm run build`. To serve that build, set `NODE_ENV=production` and run `npm start`.

## How another user connects the agent

Every user installs Rolepath locally, runs `npx codex login`, and signs in with their own ChatGPT account. The Codex CLI and SDK share that local authentication. Their Rolepath requests count against their own Codex subscription allowance; no OpenAI API key or separate API project billing is used.

## Data and privacy

- Applications are stored in `data.json` on the user's machine.
- The career profile is stored in that browser's local storage.
- Uploaded resumes are processed in memory and the originals are not stored.
- Codex authentication is managed by Codex on the local computer; Rolepath does not store credentials.
- Job URLs are checked to block private/local network addresses before fetching.
- Review every generated claim before using it in an application.

## Stack

React, Vite, Express, the Codex SDK, and a lightweight JSON data store. The storage layer is intentionally simple for a single-user local app and can later be replaced with SQLite or Postgres for a hosted multi-user version.
