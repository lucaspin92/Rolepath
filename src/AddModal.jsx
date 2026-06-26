import { useState } from "react";
import { ArrowLeft, Check, Link2, LoaderCircle, Sparkles, X } from "lucide-react";
import { api } from "./lib.jsx";

const analysisStages = [
  "The agent is looking for the job post",
  "The agent was able to find the job post",
  "The agent is analysing the content",
  "The agent is extracting the important details",
  "The agent is processing the analysis",
  "The agent is preparing your review",
];

export default function AddModal({ close, onCreated, profile, toast, aiEnabled, openSettings }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [step, setStep] = useState("input");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(-1);

  async function analyze() {
    setLoading(true); setError(""); setAnalysisStage(0);
    const stageTimer = setInterval(() => {
      setAnalysisStage((stage) => Math.min(stage + 1, analysisStages.length - 1));
    }, 1400);
    try {
      const result = await api("/api/analyze", { method: "POST", body: JSON.stringify({ url, text, profile }), retryOnUnavailable: true });
      setAnalysisStage(analysisStages.length - 1);
      setAnalysis(result); setStep("review");
    } catch (requestError) { setError(requestError.message); }
    finally { clearInterval(stageTimer); setLoading(false); setAnalysisStage(-1); }
  }

  async function save() {
    setLoading(true);
    try {
      const created = await api("/api/applications", { method: "POST", body: JSON.stringify({ ...analysis, originalUrl: url.trim(), originalDescription: text.trim() }) });
      onCreated(created); toast("Application added"); close();
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><div className="modal" role="dialog" aria-modal="true">
    <button className="modal-close" onClick={close}><X size={18} /></button>
    <div className="modal-header"><span className="modal-icon"><Sparkles size={20} /></span><div><p>New application</p><h2>{step === "input" ? "Turn a job post into a plan" : "Review the details"}</h2></div></div>
    {step === "input" ? <>
      <p className="modal-copy">Paste a link or the full job description. We’ll pull out the signal and build your prep workspace.</p>
      <label className="field"><span>Job post link</span><div className="input-with-icon"><Link2 size={16} /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://company.com/jobs/…" /></div><small>Some job boards block automatic reading. You can always paste the text below.</small></label>
      <div className="or-divider"><span>or paste the description</span></div>
      <label className="field"><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the job description here…" rows={7} /></label>
      {!aiEnabled && <div className="local-note"><Sparkles size={14} /><span>Codex is not connected. Local mode will create a starter extraction.</span><button type="button" onClick={openSettings}>Open Settings</button></div>}
      {loading && <div className="analysis-progress" role="status" aria-live="polite"><LoaderCircle className="spin" size={15} /><div><strong>{analysisStages[analysisStage]}</strong><span>{analysisStages.slice(0, analysisStage).at(-1) || "This can take a few seconds on richer job posts."}</span></div></div>}
      {error && <p className="form-error">{error}</p>}
      <button className="button primary modal-primary" disabled={loading || (!url.trim() && !text.trim())} onClick={analyze}><Sparkles size={16} /> Analyze job post</button>
    </> : <>
      {analysis.fetchWarning && <div className="local-note">{analysis.fetchWarning}</div>}
      {analysis.aiWarning && <div className="ai-fallback-note"><Sparkles size={16} /><div><strong>Local fallback used</strong><span>{analysis.aiWarning}</span></div><button type="button" onClick={openSettings}>Open Settings</button></div>}
      <div className="review-grid"><label><span>Company</span><input value={analysis.company} onChange={(event) => setAnalysis({ ...analysis, company: event.target.value })} /></label><label><span>Role</span><input value={analysis.role} onChange={(event) => setAnalysis({ ...analysis, role: event.target.value })} /></label><label><span>Location</span><input value={analysis.location} onChange={(event) => setAnalysis({ ...analysis, location: event.target.value })} /></label><label><span>Work setup</span><select value={analysis.workplace} onChange={(event) => setAnalysis({ ...analysis, workplace: event.target.value })}>{["Remote", "Hybrid", "On-site", "Not specified"].map((option) => <option key={option}>{option}</option>)}</select></label></div>
      <label className="field"><span>Role summary</span><textarea rows={4} value={analysis.summary} onChange={(event) => setAnalysis({ ...analysis, summary: event.target.value })} /></label>
      <div className="review-skills"><span>{analysis.skills?.length || 0} key skills found</span>{analysis.skills?.slice(0, 6).map((skill) => <b key={skill}>{skill}</b>)}</div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button className="button ghost" onClick={() => setStep("input")}><ArrowLeft size={15} /> Back</button><button className="button primary" disabled={loading} onClick={save}>{loading ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Add application</button></div>
    </>}
  </div></div>;
}
