import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Check, LoaderCircle, MessageCircle, Sparkles, X } from "lucide-react";
import { api } from "./lib.jsx";

const suggestions = [
  "What should I prioritize for this opportunity?",
  "Improve my cover letter opening and save it.",
  "Draft an answer for my first interview question and save it.",
  "Review my fit and update the gaps section.",
];

const fieldNames = {
  coverLetter: "cover letter", questions: "interview answers", summary: "role summary",
  responsibilities: "responsibilities", requirements: "requirements", skills: "skills",
  niceToHave: "nice-to-have", benefits: "benefits", companyNotes: "company notes",
  fitReasons: "fit reasons", gaps: "gaps", nextStep: "next step", notes: "notes",
  role: "role", company: "company", location: "location", workplace: "work setup",
  employmentType: "employment type", salary: "salary",
};

export default function OpportunityChat({ application, profile, replace, close, toast, aiEnabled, openSettings }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const messages = application.aiConversation || [];
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages.length, busy]);

  async function send(message = input) {
    const clean = message.trim();
    if (!clean || busy) return;
    setBusy(true); setError(""); setInput("");
    try {
      const result = await api(`/api/applications/${application.id}/chat`, { method: "POST", body: JSON.stringify({ message: clean, profile }) });
      replace(result.application);
      if (result.changedFields?.length) toast(`${result.changedFields.map((field) => fieldNames[field] || field).join(", ")} saved`);
    } catch (requestError) { setError(requestError.message); setInput(clean); }
    finally { setBusy(false); }
  }

  return <div className="chat-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="chat-drawer" role="dialog" aria-modal="true" aria-label="Opportunity copilot">
    <header className="chat-header"><span className="chat-avatar"><Sparkles size={17} /></span><div><h2>Opportunity copilot</h2><p>{application.role} · {application.company}</p></div><span className="chat-saved"><Check size={11} /> Changes save automatically</span><button className="icon-button" onClick={close} aria-label="Close copilot"><X size={18} /></button></header>
    <div className="chat-context"><MessageCircle size={14} /><span>I can work across the role details, cover letter, interview questions, answers, and your profile context.</span></div>
    <div className="chat-messages">
      {!messages.length && <div className="chat-welcome"><span><Bot size={24} /></span><h3>Let’s think this opportunity through</h3><p>Ask for advice, or tell me exactly what you want changed. Explicit edits are saved back to the application.</p><div className="chat-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} disabled={!aiEnabled}>{suggestion}</button>)}</div></div>}
      {messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id || `${message.createdAt}-${message.content}`}><div className="message-role">{message.role === "assistant" ? "Rolepath · Codex" : "You"}</div><div className="message-body">{message.content}</div>{message.changedFields?.length > 0 && <div className="message-updates"><Check size={11} /> Saved: {message.changedFields.map((field) => fieldNames[field] || field).join(", ")}</div>}</div>)}
      {busy && <div className="chat-message assistant thinking"><LoaderCircle className="spin" size={15} /> Thinking across the opportunity…</div>}
      <div ref={bottomRef} />
    </div>
    {!aiEnabled && <div className="chat-error"><Bot size={14} /><span>Codex is not connected. Connect your ChatGPT account to use the opportunity copilot.</span><button type="button" onClick={() => { close(); openSettings(); }}>Open Settings</button></div>}
    {error && <div className="chat-error">{error}</div>}
    <footer className="chat-composer"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask about this role, or request a saved change…" disabled={busy || !aiEnabled} /><button onClick={() => send()} disabled={!input.trim() || busy || !aiEnabled} aria-label="Send message"><ArrowUp size={16} /></button><span>Enter to send · Shift + Enter for a new line</span></footer>
  </aside></div>;
}
