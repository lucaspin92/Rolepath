import {
  ArrowRight, BriefcaseBusiness, CalendarDays, Check, Home, LayoutList, MapPin,
  Menu, Plus, Settings, Sparkles, UserRound,
} from "lucide-react";

export const stages = ["Applied", "Interview", "Offer", "Rejected", "Withdrawn"];
export const stageClass = { Applied: "blue", Interview: "amber", Offer: "green", Rejected: "red", Withdrawn: "red" };
export const blankProfile = { name: "", email: "", phone: "", location: "", linkedin: "", headline: "", strengths: "", achievement: "", experience: "", education: "", languages: "", preferences: "" };

export async function api(path, options = {}) {
  const { retryOnUnavailable = false, ...fetchOptions } = options;
  const request = async () => {
    try { return await fetch(path, { headers: { "Content-Type": "application/json", ...fetchOptions.headers }, ...fetchOptions }); }
    catch { throw new Error("Rolepath could not reach its local API. Make sure the app is running, then try again."); }
  };
  const delays = retryOnUnavailable ? [0, 450, 1000, 2000, 4000] : [0];
  let response;
  let lastError;
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      response = await request();
      const contentType = response.headers.get("content-type") || "";
      const transientProxyFailure = [502, 503, 504].includes(response.status) || (response.status === 500 && !contentType.includes("application/json"));
      if (!transientProxyFailure || delay === delays.at(-1)) break;
    } catch (error) {
      lastError = error;
      if (delay === delays.at(-1)) throw error;
    }
  }
  if (!response) throw lastError || new Error("Rolepath could not reach its local API. Make sure the app is running, then try again.");
  if (!response.ok) {
    const data = response.headers.get("content-type")?.includes("application/json") ? await response.json().catch(() => ({})) : {};
    const fallback = response.status === 413
      ? "The job description is too large. Paste a shorter version and try again."
      : response.status >= 500
        ? "Rolepath's local API is still starting or temporarily unavailable. Wait a few seconds, then try again."
        : `The request could not be completed (${response.status}).`;
    throw new Error(data.error || fallback);
  }
  return response.status === 204 ? null : response.json();
}

export function Logo() {
  return <div className="logo"><span className="logo-mark"><BriefcaseBusiness size={17} /></span><span>rolepath</span></div>;
}
export function StatusPill({ status }) {
  return <span className={`status ${stageClass[status] || "slate"}`}><i />{status}</span>;
}
export function EmptyState({ onAdd }) {
  return <div className="empty-state"><div className="empty-illustration"><BriefcaseBusiness size={30} /></div><h2>Your next role starts here</h2><p>Add a job post and Rolepath will turn it into a clear, interview-ready workspace.</p><button className="button primary" onClick={onAdd}><Plus size={16} /> Add your first application</button></div>;
}
export function Sidebar({ page, setPage, counts, mobileOpen, close }) {
  const items = [["dashboard", Home, "Overview"], ["applications", LayoutList, "Applications", counts.all], ["interviews", CalendarDays, "Interviews", counts.interviews]];
  return <>{mobileOpen && <button className="sidebar-backdrop" onClick={close} aria-label="Close menu" />}<aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
    <Logo /><nav><p className="nav-label">Workspace</p>{items.map(([id, Icon, label, count]) => <button key={id} className={page === id ? "active" : ""} onClick={() => { setPage(id); close(); }}><Icon size={17} /><span>{label}</span>{count > 0 && <b>{count}</b>}</button>)}<p className="nav-label second">Account</p><button onClick={() => { setPage("profile"); close(); }} className={page === "profile" ? "active" : ""}><UserRound size={17} /><span>My profile</span></button></nav>
    <div className="sidebar-tip"><span><Sparkles size={14} /> Small advantage</span><p>Tailor one achievement to each role. Specific beats impressive.</p></div><button className={`settings-link ${page === "settings" ? "active" : ""}`} onClick={() => { setPage("settings"); close(); }}><Settings size={16} /> Settings</button><span className="app-version">V 1.0</span>
  </aside></>;
}
export function Header({ title, subtitle, onAdd, menu }) {
  return <header className="topbar"><button className="mobile-menu" onClick={menu}><Menu size={20} /></button><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{onAdd && <button className="button primary" onClick={onAdd}><Plus size={17} /> <span>New application</span></button>}</header>;
}
export function Metric({ icon: Icon, label, value, detail, tone }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={18} /></div><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>;
}
export function ApplicationTable({ applications, openApplication }) {
  if (!applications.length) return null;
  return <div className="table-wrap"><table><thead><tr><th>Company & role</th><th>Status</th><th className="hide-small">Location</th><th className="hide-medium">Added</th><th /></tr></thead><tbody>{applications.map((item) => <tr key={item.id} onClick={() => openApplication(item)}>
    <td><div className="company-cell"><span className="company-avatar">{(item.company || "?").slice(0, 1).toUpperCase()}</span><div><strong>{item.company}</strong><span>{item.role}</span></div></div></td><td><StatusPill status={item.status} /></td><td className="hide-small"><span className="muted-cell"><MapPin size={14} />{item.workplace === "Not specified" ? item.location : item.workplace}</span></td><td className="hide-medium"><span className="date-cell">{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></td><td><button className="icon-button" aria-label="Open"><ArrowRight size={16} /></button></td>
  </tr>)}</tbody></table></div>;
}
export function ListBlock({ title, items, empty = "Nothing specific was listed." }) {
  return <div className="detail-block"><h3>{title}</h3>{items?.length ? <ul>{items.map((item, i) => <li key={`${item}-${i}`}><Check size={14} /><span>{item}</span></li>)}</ul> : <p className="empty-copy">{empty}</p>}</div>;
}
export function Toast({ toast }) {
  return toast ? <div className={`toast ${toast.error ? "error" : ""}`}>{toast.error ? <span>!</span> : <Check size={15} />}{toast.message}</div> : null;
}
