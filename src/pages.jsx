import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronUp, ClipboardCheck, GripVertical, MapPin, Plus, Search, Sparkles, Target, Trash2 } from "lucide-react";
import { ApplicationTable, EmptyState, Header, Metric, StatusPill, stages } from "./lib.jsx";

const hasInterviewActivity = (application) => application.status === "Interview" || Boolean(application.interviewRounds?.length);

function nextInterviewRound(application) {
  const rounds = application.interviewRounds || [];
  return rounds.find((round) => round.status !== "Completed") || rounds[rounds.length - 1];
}

export function Dashboard({ applications, onAdd, openApplication, goApplications }) {
  const applied = applications.length;
  const interviewApplications = applications.filter(hasInterviewActivity);
  const interviews = interviewApplications.length;
  const offers = applications.filter((item) => item.status === "Offer").length;
  const responses = applications.filter((item) => hasInterviewActivity(item) || item.status === "Offer").length;
  const responseRate = applied ? Math.round((responses / applied) * 100) : 0;
  return <><Header title="Good morning" subtitle="Here’s the pulse of your job search." onAdd={onAdd} /><main className="main-content">
    {!applications.length ? <EmptyState onAdd={onAdd} /> : <><section className="metrics-grid">
      <Metric icon={BriefcaseBusiness} label="Active applications" value={applications.filter((item) => !["Rejected", "Offer"].includes(item.status)).length} detail={`${applied} submitted`} tone="lilac" />
      <Metric icon={CalendarDays} label="Interview processes" value={interviews} detail={interviews ? "Rounds tracked separately" : "None scheduled yet"} tone="peach" />
      <Metric icon={Target} label="Response rate" value={`${responseRate}%`} detail="From submitted roles" tone="mint" />
      <Metric icon={ClipboardCheck} label="Offers" value={offers} detail={offers ? "You did it" : "Keep the momentum"} tone="sky" />
    </section><section className="dashboard-grid">
      <div className="panel wide"><div className="panel-heading"><div><h2>Recent applications</h2><p>The roles you’re moving forward</p></div><button className="text-button" onClick={goApplications}>View all <ArrowRight size={14} /></button></div><ApplicationTable applications={applications.slice(0, 5)} openApplication={openApplication} /></div>
      <div className="panel focus-panel"><div className="panel-heading"><div><h2>Focus this week</h2><p>A simple next move</p></div><span className="spark-badge"><Sparkles size={14} /></span></div>{interviews ? <div className="focus-content"><span className="focus-number">{interviews}</span><h3>Prepare your interview stories</h3><p>Turn your strongest results into clear STAR answers before the next phase.</p><button className="button secondary" onClick={() => openApplication(interviewApplications[0])}>Start preparing</button></div> : <div className="focus-content"><span className="focus-number">01</span><h3>Build a quality shortlist</h3><p>Add one role you genuinely want, then tailor your evidence to it.</p><button className="button secondary" onClick={onAdd}>Add a role</button></div>}</div>
    </section></>}
  </main></>;
}

export function ApplicationsPage({ applications, onAdd, openApplication, update, remove, toast }) {
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [overStage, setOverStage] = useState("");
  const [collapsedCards, setCollapsedCards] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("rolepath-collapsed-cards") || "[]")); }
    catch { return new Set(); }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = applications.filter((item) => `${item.company} ${item.role} ${item.location}`.toLowerCase().includes(normalizedQuery));

  async function moveApplication(id, status) {
    const application = applications.find((item) => item.id === id);
    if (!application || application.status === status) return;
    try { await update(id, { status }); toast(`Moved to ${status}`); }
    catch (error) { toast(error.message, true); }
  }

  function drop(event, status) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/application-id") || draggingId;
    setDraggingId(""); setOverStage("");
    if (id) moveApplication(id, status);
  }

  function toggleCard(id) {
    setCollapsedCards((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("rolepath-collapsed-cards", JSON.stringify([...next]));
      return next;
    });
  }

  return <><Header title="Applications" subtitle={`${applications.length} role${applications.length === 1 ? "" : "s"} in your pipeline`} onAdd={onAdd} /><main className="main-content kanban-page">{!applications.length ? <EmptyState onAdd={onAdd} /> : <>
    <div className="kanban-toolbar"><label className="searchbox"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, role, or location" /></label><span><GripVertical size={14} /> Drag cards between stages</span></div>
    <div className="kanban-board" aria-label="Application pipeline">{stages.map((stage) => {
      const items = filtered.filter((item) => item.status === stage);
      return <section className={`kanban-column ${overStage === stage ? "drag-over" : ""}`} key={stage} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOverStage(stage); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOverStage(""); }} onDrop={(event) => drop(event, stage)}>
        <header className={`kanban-column-header ${stage.toLowerCase()}`}><div><i /><h2>{stage}</h2></div><span>{items.length}</span></header>
        <div className="kanban-cards">{items.map((item) => {
          const collapsed = collapsedCards.has(item.id);
          return <article className={`kanban-card ${collapsed ? "collapsed" : ""} ${draggingId === item.id ? "dragging" : ""}`} key={item.id} draggable onDragStart={(event) => { setDraggingId(item.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/application-id", item.id); }} onDragEnd={() => { setDraggingId(""); setOverStage(""); }} onClick={() => openApplication(item)} onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) openApplication(item); }} tabIndex={0}>
            <div className="kanban-card-top"><span className="company-avatar">{(item.company || "?")[0]}</span><div className="kanban-card-title"><strong title={item.company}>{item.company}</strong><h3>{item.role}</h3></div><div className="kanban-card-controls" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><button className="kanban-card-toggle" onClick={() => toggleCard(item.id)} title={collapsed ? "Expand card" : "Collapse card"} aria-label={`${collapsed ? "Expand" : "Collapse"} ${item.company} card`}>{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button><GripVertical className="drag-handle" size={16} /></div></div>
            {!collapsed && <div className="kanban-card-footer"><span className="kanban-location"><MapPin size={13} />{item.workplace === "Not specified" ? item.location || "Not specified" : item.workplace}</span><button className="kanban-delete" onClick={(event) => { event.stopPropagation(); remove(item.id); }} title="Delete application" aria-label={`Delete ${item.company} application`}><Trash2 size={14} /></button></div>}
          </article>;
        })}{!items.length && <div className="kanban-empty"><span>Drop an application here</span></div>}</div>
      </section>;
    })}</div>
    {!filtered.length && <div className="kanban-no-results"><Search size={19} /><span>No applications match “{query}”.</span></div>}
  </>}</main></>;
}

export function InterviewsPage({ applications, openApplication, onAdd }) {
  const interviews = applications.filter(hasInterviewActivity);
  return <><Header title="Interviews" subtitle="Every phase, one preparation workspace." onAdd={onAdd} /><main className="main-content">{!interviews.length ? <div className="empty-state"><div className="empty-illustration"><CalendarDays size={29} /></div><h2>No interviews yet</h2><p>Add an interview phase inside any application and it will appear here.</p><button className="button secondary" onClick={onAdd}><Plus size={16} /> Add an application</button></div> : <div className="interview-grid">{interviews.map((item) => {
    const round = nextInterviewRound(item);
    const formattedDate = round?.date ? new Date(`${round.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Date not set";
    return <button className="interview-card" key={item.id} onClick={() => openApplication(item)}><span className="company-avatar large">{item.company[0]}</span><div><StatusPill status="Interview" /><h2>{item.role}</h2><p>{item.company} · {item.workplace}</p>{round && <span className="interview-next">Next: {round.name} · {formattedDate}</span>}</div><ArrowRight size={18} /></button>;
  })}</div>}</main></>;
}
