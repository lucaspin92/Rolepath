import { useRef, useState } from "react";
import { AlertCircle, Check, FileText, LoaderCircle, ShieldCheck, UploadCloud } from "lucide-react";
import { Header } from "./lib.jsx";

const fieldLabels = {
  name: "Name", email: "Email", phone: "Phone", location: "Location", linkedin: "LinkedIn",
  headline: "Professional headline", strengths: "Core strengths", achievement: "Achievement to draw from",
  experience: "Work experience", education: "Education", languages: "Languages", preferences: "What you’re looking for",
};

export default function ProfilePage({ profile, setProfile, aiEnabled, openSettings }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const inputRef = useRef(null);

  function persist(next) {
    setDraft(next);
    setProfile(next);
    localStorage.setItem("rolepath-profile", JSON.stringify(next));
  }

  function save() {
    persist(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function importResume(file) {
    if (!file) return;
    setUploading(true); setUploadError(""); setImportResult(null);
    try {
      const form = new FormData();
      form.append("resume", file);
      const response = await fetch("/api/profile/extract", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not import this resume.");
      const next = { ...draft };
      for (const [key, value] of Object.entries(result.profile || {})) if (value) next[key] = value;
      persist(next);
      setImportResult({ ...result, missingFields: (result.missingFields || []).filter((key) => !next[key]) });
    } catch (error) { setUploadError(error.message); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  function field(key, options = {}) {
    const missing = importResult?.missingFields?.includes(key);
    const common = { value: draft[key] || "", onChange: (event) => setDraft({ ...draft, [key]: event.target.value }), placeholder: options.placeholder || "" };
    return <label className={`${options.full ? "full" : ""} ${missing ? "missing-field" : ""}`}><span>{fieldLabels[key]}{missing && <small>Not found — add manually</small>}</span>{options.textarea ? <textarea {...common} className={options.tall ? "tall" : ""} /> : <input {...common} type={options.type || "text"} />}</label>;
  }

  return <><Header title="My profile" subtitle="Import your resume, then fill any gaps in your own words." /><main className="main-content profile-layout">
    <section className="panel profile-panel">
      <div className="resume-import">
        <div className="resume-import-copy"><span className="resume-icon"><FileText size={20} /></span><div><h2>Import your resume</h2><p>PDF, DOCX, or legacy DOC · up to 8 MB</p></div></div>
        <button className="resume-dropzone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); importResume(event.dataTransfer.files?.[0]); }} disabled={uploading}>
          {uploading ? <LoaderCircle className="spin" size={22} /> : <UploadCloud size={22} />}<strong>{uploading ? "Reading your resume…" : "Choose a file or drop it here"}</strong><span>We extract text in memory and never keep the original file.</span>
        </button>
        <input ref={inputRef} className="file-input" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => importResume(event.target.files?.[0])} />
        {uploadError && <div className="resume-message error"><AlertCircle size={15} />{uploadError}</div>}
        {importResult && <div className="resume-message success"><Check size={15} /><div><strong>{importResult.fileName} imported</strong><span>{importResult.extractionMode === "visual" ? `Read visually from ${importResult.renderedPages} page${importResult.renderedPages === 1 ? "" : "s"}. ` : ""}{importResult.missingFields.length ? `${importResult.missingFields.length} field${importResult.missingFields.length === 1 ? "" : "s"} still need your input.` : "Your profile is fully populated."} {importResult.warning || (importResult.mode === "local" ? "Codex is not connected, so local extraction was used." : "")}</span></div></div>}
      </div>
      <div className="panel-heading profile-heading"><div><h2>Your career context</h2><p>Imported details remain editable. Nothing is sent anywhere until you ask Rolepath to generate content.</p></div></div>
      <div className="form-section-title">Contact</div><div className="form-grid profile-fields">
        {field("name", { placeholder: "Alex Morgan" })}{field("email", { type: "email", placeholder: "alex@example.com" })}{field("phone", { placeholder: "+351 912 345 678" })}{field("location", { placeholder: "Lisbon, Portugal" })}{field("linkedin", { full: true, placeholder: "linkedin.com/in/alexmorgan" })}
      </div>
      <div className="form-section-title">Career story</div><div className="form-grid profile-fields">
        {field("headline", { full: true, placeholder: "Product designer · B2B SaaS" })}{field("strengths", { full: true, textarea: true, placeholder: "Research, systems thinking, stakeholder alignment…" })}{field("achievement", { full: true, textarea: true, placeholder: "Led a redesign that increased activation by 18%…" })}{field("experience", { full: true, textarea: true, tall: true, placeholder: "Your roles, responsibilities, and results…" })}{field("education", { full: true, textarea: true, placeholder: "Degrees, training, and relevant certifications…" })}{field("languages", { full: true, textarea: true, placeholder: "Portuguese — native; English — fluent…" })}{field("preferences", { full: true, textarea: true, placeholder: "Remote-friendly team, meaningful ownership…" })}
      </div>
      <button className="button primary" onClick={save}>{saved && <Check size={16} />}{saved ? "Saved" : "Save profile"}</button>
    </section>
    <aside className="panel connection-card"><span className={`connection-dot ${aiEnabled ? "on" : ""}`} /><h3>{aiEnabled ? "Codex is connected" : "Codex is not connected"}</h3><p>{aiEnabled ? "Rolepath uses your ChatGPT Codex login for richer resume interpretation and tailored content." : "Resume import still works with local extraction. Connect Codex in Settings for richer interpretation."}</p><button className="button ghost connection-settings" onClick={openSettings}>Open Settings</button><div className="privacy-note"><ShieldCheck size={15} /><span>The original resume is processed in memory and is not stored by Rolepath.</span></div></aside>
  </main></>;
}
