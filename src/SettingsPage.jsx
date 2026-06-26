import { useEffect, useState } from "react";
import { Check, Clipboard, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { api, Header } from "./lib.jsx";

const loginCommand = "npx codex login";

export default function SettingsPage({ agentStatus, onStatusChange, toast }) {
  const [checking, setChecking] = useState(false);
  const connected = Boolean(agentStatus?.connected);
  const apiLogin = agentStatus?.authMode === "api";

  async function checkConnection(silent = false) {
    setChecking(true);
    try {
      const result = await api("/api/codex/status");
      onStatusChange(result);
      if (!silent) toast(result.connected ? "Codex is connected with ChatGPT" : "Codex is not connected yet", !result.connected);
    } catch (error) { if (!silent) toast(error.message, true); }
    finally { setChecking(false); }
  }

  useEffect(() => { checkConnection(true); }, []);

  async function copyCommand() {
    await navigator.clipboard.writeText(loginCommand);
    toast("Login command copied");
  }

  return <><Header title="Settings" subtitle="Connect the local Codex agent and manage application preferences." /><main className="main-content settings-page">
    <section className="panel settings-panel">
      <div className="settings-heading"><span className="settings-icon"><Sparkles size={20} /></span><div><h2>Codex agent</h2><p>Rolepath uses Codex through your ChatGPT account. No OpenAI API key or separate API billing is required.</p></div><span className={`connection-badge ${connected ? "on" : apiLogin ? "warning" : ""}`}><i />{connected ? "Connected" : apiLogin ? "Wrong login type" : "Not connected"}</span></div>
      <div className={`settings-status ${connected ? "active" : "inactive"}`}>
        {connected ? <Check size={17} /> : <Terminal size={17} />}
        <div><strong>{connected ? "Signed in with ChatGPT" : apiLogin ? "Codex is using an API-key login" : "Connect Codex to continue"}</strong><span>{connected ? "Job analysis, writing, interview prep, and the opportunity copilot use your Codex subscription allowance." : apiLogin ? "Run “npx codex logout”, then sign in again and choose ChatGPT. Rolepath intentionally does not use API-key authentication." : "The local fallback still works, but the agent features need a one-time ChatGPT sign-in."}</span></div>
      </div>

      <div className="agent-setup">
        <div className="setup-heading"><div><span className="section-kicker">One-time setup</span><h3>Connect this computer</h3></div><button className="button ghost" onClick={() => checkConnection()} disabled={checking}>{checking ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Check connection</button></div>
        <ol className="setup-steps">
          <li><b>1</b><div><strong>Open a terminal in the Rolepath folder</strong><span>PowerShell, Terminal, or the integrated terminal all work.</span></div></li>
          <li><b>2</b><div><strong>Run the Codex login command</strong><span className="command-row"><code>{loginCommand}</code><button type="button" onClick={copyCommand} aria-label="Copy login command"><Clipboard size={14} /></button></span></div></li>
          <li><b>3</b><div><strong>Choose “Sign in with ChatGPT”</strong><span>Your browser will open to complete authentication. Then return here and check the connection.</span></div></li>
        </ol>
      </div>

      <div className="settings-privacy"><ShieldCheck size={18} /><div><strong>Local and private by design</strong><p>Rolepath never stores an API key. It uses the Codex login already saved on this computer, and each user signs in with their own ChatGPT account.</p></div></div>
    </section>
  </main></>;
}
