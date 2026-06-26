import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, CircleHelp, Copy, Download, ExternalLink, FileText, LoaderCircle, MapPin, MessageCircle, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { api, ListBlock, stages, StatusPill } from "./lib.jsx";
import InterviewProcess from "./InterviewProcess.jsx";
import OpportunityChat from "./OpportunityChat.jsx";
import { saveCoverLetterPdf } from "./pdf.js";

const defaultCoverLetterGuidance = "Make the cover letter sound less AI and more human, also don't use em dashes and don't create lists of items mentioned in the post, make it friendly, concise and to the point and remove all AI slop.";

export default function Detail({ application, onBack, update, replace, remove, profile, toast, aiEnabled, openSettings }) {
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState(application.notes || "");
  const [guidance, setGuidance] = useState(defaultCoverLetterGuidance);
  const [chatOpen, setChatOpen] = useState(false);
  const [letterDraft, setLetterDraft] = useState(application.coverLetter || "");
  const [letterSaved, setLetterSaved] = useState(true);

  useEffect(() => setNotes(application.notes || ""), [application.id, application.notes]);
  useEffect(() => { setLetterDraft(application.coverLetter || ""); setLetterSaved(true); }, [application.id, application.coverLetter]);

  async function generateLetter() {
    setBusy("letter");
    try {
      const result = await api(`/api/applications/${application.id}/cover-letter`, { method: "POST", body: JSON.stringify({ profile, guidance }) });
      replace(result.application);
      setLetterSaved(true);
      toast(result.warning ? "Codex unavailable; a local cover letter was saved." : result.mode === "codex" ? "Cover letter generated and saved" : "Starter letter created and saved in local mode", Boolean(result.warning));
    } catch (error) { toast(error.message, true); }
    finally { setBusy(""); }
  }

  async function saveLetter() {
    const updated = await update(application.id, { coverLetter: letterDraft, coverLetterUpdatedAt: new Date().toISOString() });
    replace(updated); setLetterSaved(true); toast("Cover letter saved");
  }

  async function exportLetterPdf() {
    if (!letterDraft.trim()) return toast("Generate or write a cover letter first.", true);
    setBusy("pdf");
    try {
      const filename = await saveCoverLetterPdf({ application, text: letterDraft, profile });
      toast(`Saved ${filename}`);
    } catch {
      toast("Could not create the PDF. Please try again.", true);
    } finally { setBusy(""); }
  }

  async function generateQuestions() {
    setBusy("questions");
    try {
      const result = await api(`/api/applications/${application.id}/questions`, { method: "POST", body: JSON.stringify({ profile }) });
      await update(application.id, { questions: result.questions });
      toast(result.warning ? "Codex unavailable; local interview questions were created." : result.mode === "codex" ? "Interview prep generated" : "Starter questions created in local mode", Boolean(result.warning));
    } catch (error) { toast(error.message, true); }
    finally { setBusy(""); }
  }

  return <div className="detail-shell">
    <div className="detail-topbar">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Applications</button>
      <div className="detail-actions">
        <button className="button copilot-button" onClick={() => setChatOpen(true)}><MessageCircle size={14} /> Talk to Codex</button>
        {application.url && <a className="button ghost" href={application.url} target="_blank" rel="noreferrer">View job <ExternalLink size={14} /></a>}
        <button className="icon-button danger" title="Delete" onClick={() => remove(application.id)}><Trash2 size={16} /></button>
      </div>
    </div>
    <main className="detail-main">
      <section className="job-hero"><span className="company-avatar hero-avatar">{(application.company || "?")[0]}</span><div className="job-title"><div className="eyebrow">{application.company}</div><h1>{application.role}</h1><p><MapPin size={15} /> {application.location} {application.workplace !== "Not specified" && `· ${application.workplace}`} {application.employmentType && `· ${application.employmentType}`}</p></div><label className="status-select"><StatusPill status={application.status} /><ChevronDown size={14} /><select value={application.status} onChange={(event) => update(application.id, { status: event.target.value })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label></section>
      <div className="detail-tabs">{["Overview", "Cover letter", "Interview prep", "Notes"].map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}{item === "Interview prep" && application.questions?.length > 0 && <b>{application.questions.length}</b>}</button>)}</div>

      {tab === "Overview" && <Overview application={application} aiEnabled={aiEnabled} openSettings={openSettings} />}

      {tab === "Cover letter" && <section className="generator-layout">
        <div className="generator-intro"><span className="generator-icon"><FileText size={21} /></span><h2>A letter that sounds like you</h2><p>Rolepath connects your evidence to what this team actually needs. Generated letters are saved immediately.</p><label><span>Optional direction</span><input value={guidance} onChange={(event) => setGuidance(event.target.value)} placeholder="e.g. warmer tone, emphasize leadership" /></label><button className="button primary" onClick={generateLetter} disabled={busy === "letter"}>{busy === "letter" ? <LoaderCircle className="spin" size={16} /> : <WandSparkles size={16} />}{application.coverLetter ? "Regenerate and save" : "Generate and save"}</button><button className="button ai-edit-button" onClick={() => setChatOpen(true)}><MessageCircle size={14} /> Refine with Codex</button></div>
        <div className="document-card">{application.coverLetter ? <><div className="document-toolbar"><span className={`draft-state ${letterSaved ? "saved" : "unsaved"}`}>{letterSaved ? <Check size={12} /> : <i />}{letterSaved ? "Saved" : "Unsaved changes"}</span><div>{!letterSaved && <button className="text-button" onClick={saveLetter}><Check size={14} /> Save draft</button>}<button className="text-button" onClick={exportLetterPdf} disabled={busy === "pdf"}>{busy === "pdf" ? <LoaderCircle className="spin" size={14} /> : <Download size={14} />} Save as PDF</button><button className="text-button" onClick={() => { navigator.clipboard.writeText(letterDraft); toast("Copied to clipboard"); }}><Copy size={14} /> Copy</button></div></div><textarea value={letterDraft} onChange={(event) => { setLetterDraft(event.target.value); setLetterSaved(false); }} /></> : <div className="document-placeholder"><FileText size={32} /><h3>Your draft will appear here</h3><p>Add your profile context for a more personal result.</p></div>}</div>
      </section>}

      {tab === "Interview prep" && <section className="prep-section">
        <InterviewProcess application={application} update={update} toast={toast} />
        <div className="prep-heading"><div><span className="section-kicker">Practice with purpose</span><h2>Likely interview questions</h2><p>Built from this role’s actual responsibilities and requirements.</p></div><div className="prep-actions"><button className="button ghost" onClick={() => setChatOpen(true)}><MessageCircle size={14} /> Practice with Codex</button><button className="button primary" onClick={generateQuestions} disabled={busy === "questions"}>{busy === "questions" ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}{application.questions?.length ? "Refresh questions" : "Generate questions"}</button></div></div>
        {application.questions?.length ? <div className="question-list">{application.questions.map((question, index) => <details className="question-card" key={`${question.question}-${index}`}><summary><span>{String(index + 1).padStart(2, "0")}</span><div><small>{question.category}</small><h3>{question.question}</h3></div><ChevronDown size={18} /></summary><div className="question-answer"><p><strong>Why they may ask:</strong> {question.why}</p><p><strong>How to prepare:</strong> {question.prep}</p>{question.answer && <div className="draft-answer"><span>Draft answer</span><p>{question.answer}</p></div>}</div></details>)}</div> : <div className="empty-prep"><CircleHelp size={29} /><h3>No generic question dump here</h3><p>Generate a focused set based on this particular role.</p></div>}
      </section>}

      {tab === "Notes" && <section className="notes-layout"><div><span className="section-kicker">Your private workspace</span><h2>Notes & follow-ups</h2><p>Capture recruiter names, interview details, things to research, and the questions you want to ask.</p></div><div className="notes-editor"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Recruiter conversation, interview date, salary notes, follow-up tasks…" /><button className="button primary" onClick={async () => { await update(application.id, { notes }); toast("Notes saved"); }}>Save notes</button></div></section>}
    </main>
    {chatOpen && <OpportunityChat application={application} profile={profile} replace={replace} close={() => setChatOpen(false)} toast={toast} aiEnabled={aiEnabled} openSettings={openSettings} />}
  </div>;
}

function Overview({ application, aiEnabled, openSettings }) {
  const originalLink = application.originalUrl || application.url || "";
  const originalDescription = application.originalDescription || application.sourceText || "";
  return <div className="overview-layout"><section className="detail-content">
    {!aiEnabled && <div className="local-banner"><Sparkles size={16} /><div><strong>Codex is not connected</strong><span>This opportunity uses local analysis. Connect Codex for deeper analysis and fit scoring.</span></div><button type="button" onClick={openSettings}>Open Settings</button></div>}
    <div className="summary-card"><span className="section-kicker">Role snapshot</span><p>{application.summary}</p><div className="skill-row">{application.skills?.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
    {(originalLink || originalDescription) && <details className="source-card"><summary><span><FileText size={14} /> Original job post</span><ChevronDown size={16} /></summary><div className="source-card-body">{originalLink && <p><strong>Link</strong><a href={originalLink} target="_blank" rel="noreferrer">{originalLink}<ExternalLink size={12} /></a></p>}{originalDescription && <><strong>Description</strong><pre>{originalDescription}</pre></>}</div></details>}
    <div className="two-col"><ListBlock title="What you’ll do" items={application.responsibilities} /><ListBlock title="What they’re looking for" items={application.requirements} /></div><div className="two-col"><ListBlock title="Nice to have" items={application.niceToHave} /><ListBlock title="Benefits" items={application.benefits} /></div>
  </section><aside className="detail-aside">
    <div className="fit-card"><div className="fit-top"><span>Match overview</span><strong>{application.fitScore > 0 ? `${application.fitScore}%` : "—"}</strong></div><div className="fit-track"><i style={{ width: `${application.fitScore || 0}%` }} /></div><p>{application.fitScore ? "Based on your saved profile and this job description." : "Complete your profile for a meaningful comparison."}</p></div>
    <div className="aside-card"><h3>Why it could fit</h3>{application.fitReasons?.length ? application.fitReasons.map((item) => <p className="positive" key={item}><Check size={14} />{item}</p>) : <p className="empty-copy">Add profile details to compare your experience.</p>}</div><div className="aside-card"><h3>Points to verify</h3>{application.gaps?.map((item) => <p key={item}><CircleHelp size={14} />{item}</p>)}</div>
    <div className="aside-card facts"><h3>Key details</h3><dl><div><dt>Salary</dt><dd>{application.salary || "Not specified"}</dd></div><div><dt>Work setup</dt><dd>{application.workplace}</dd></div><div><dt>Added</dt><dd>{new Date(application.createdAt).toLocaleDateString()}</dd></div></dl></div>
  </aside></div>;
}
