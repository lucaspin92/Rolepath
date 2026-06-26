# Rolepath user guide

This guide explains how to run Rolepath and how to use the main workflows.

## 1. Start the application

The GitHub repository starts blank. It does not include anyone else's jobs, profile, tokens, resumes, or local sessions. Each user creates their own local `data.json` and profile data after running the app.

From the repository folder:

```powershell
npm install
npm run dev
```

Open:

[http://127.0.0.1:5173](http://127.0.0.1:5173)

If the app was closed unexpectedly and the ports are still busy, run:

```powershell
npm run stop
npm run dev
```

## 2. Connect Codex

AI features need a local Codex sign-in.

```powershell
npx codex login
```

Choose **Sign in with ChatGPT**.

After signing in, open Rolepath and go to **Settings**. It should show that Codex is connected.

If Codex is not connected, Rolepath still works in local fallback mode for basic extraction, but generated cover letters, interview prep, resume interpretation, and the opportunity copilot work best with Codex connected.

## 3. Import your profile

Go to **My profile**.

You can import:

- PDF
- DOCX
- legacy DOC

Drop your resume into the import box or choose a file manually.

Rolepath will try to fill:

- name
- email
- phone
- location
- LinkedIn
- professional headline
- strengths
- achievement
- experience
- education
- languages
- preferences

If a field is missing, fill it manually. Imported fields remain editable.

Rolepath does not store the original resume file. It processes the file in memory and saves only the profile fields you keep in the app.

## 4. Add a job application

Click **New application**.

You can provide:

- a job post link
- a pasted job description
- both

When you click **Analyze job post**, Rolepath shows live stages while it works, such as:

- The agent is looking for the job post
- The agent was able to find the job post
- The agent is analysing the content
- The agent is extracting the important details
- The agent is processing the analysis
- The agent is preparing your review

Review the extracted fields before saving:

- company
- role
- location
- work setup
- role summary
- key skills

Click **Add application**.

After saving, Rolepath opens the job's detail page automatically.

## 5. Review the job detail page

The **Overview** tab shows:

- role summary
- skills
- responsibilities
- requirements
- nice-to-have items
- benefits
- fit signals
- gaps to verify

Use the **Original job post** section to view the saved source. It is collapsed by default.

If the application came from a link, the link is clickable. If you pasted a description, the original pasted text is saved there too.

## 6. Manage applications on the Kanban board

Open **Applications** to see the Kanban board.

Stages:

- Applied
- Interview
- Offer
- Rejected
- Withdrawn

You can:

- search by company, role, or location
- drag cards between stages
- collapse or expand cards
- delete applications

Deleting an application removes its cover letter, interview prep, conversation, and notes.

## 7. Generate and manage a cover letter

Open an application and go to **Cover letter**.

The optional direction field has a default style instruction:

> Make the cover letter sound less AI and more human, also don't use em dashes and don't create lists of items mentioned in the post, make it friendly, concise and to the point and remove all AI slop.

You can edit that text before generating.

Click **Generate and save** or **Regenerate and save**.

Generated cover letters are saved to the application automatically.

After a letter exists, you can:

- edit it manually
- save the draft
- copy it to the clipboard
- save it as a PDF
- refine it with Codex

The PDF export uses the text currently shown in the editor, including unsaved edits.

## 8. Generate interview preparation

Open an application and go to **Interview prep**.

You can:

- add interview phases
- track interview rounds
- generate likely interview questions
- save draft answers
- practice with Codex

Generated questions are based on the role and your profile context.

## 9. Talk to Codex about an opportunity

Click **Talk to Codex** from the application detail page.

The opportunity copilot can help with:

- updating role details
- improving cover letter sections
- answering interview questions
- refining interview answers
- discussing gaps or fit
- improving notes about the opportunity

When Codex updates a supported section, Rolepath saves that change to the application.

## 10. Troubleshooting

### The app is blank or cannot reach the API

Run:

```powershell
npm run stop
npm run dev
```

Then reopen:

[http://127.0.0.1:5173](http://127.0.0.1:5173)

### Codex is not connected

Run:

```powershell
npx codex login
```

Choose **Sign in with ChatGPT**, then check **Settings** again.

### A job link cannot be read

Some job boards block automated reading or render all content with JavaScript.

If that happens, paste the job description manually into the description box.

### Resume import misses fields

Some resumes are image-based or have unusual layouts. Rolepath will try visual extraction when possible, but you may still need to fill missing fields manually.

### Old processes keep running

Run:

```powershell
npm run stop
```

This stops stale Rolepath processes for the local API and frontend.
