import { CalendarDays, Check, Plus, Trash2 } from "lucide-react";

export default function InterviewProcess({ application, update, toast }) {
  const rounds = application.interviewRounds || [];

  async function saveRounds(nextRounds, moveToInterview = false) {
    const changes = { interviewRounds: nextRounds };
    if (moveToInterview && application.status === "Applied") changes.status = "Interview";
    await update(application.id, changes);
  }

  async function addRound() {
    const number = rounds.length + 1;
    const name = number === 1 ? "Recruiter screen" : number === 2 ? "Hiring manager interview" : `Interview ${number}`;
    await saveRounds([...rounds, { id: crypto.randomUUID(), name, date: "", status: "Upcoming" }], true);
    toast("Interview phase added");
  }

  function updateRound(id, changes) {
    return saveRounds(rounds.map((round) => round.id === id ? { ...round, ...changes } : round));
  }

  async function removeRound(id) {
    await saveRounds(rounds.filter((round) => round.id !== id));
    toast("Interview phase removed");
  }

  return <section className="process-card">
    <div className="process-heading">
      <div><span className="section-kicker">Your interview journey</span><h2>Interview process</h2><p>Track every conversation, exercise, and final round separately.</p></div>
      <button className="button secondary" onClick={addRound}><Plus size={15} /> Add phase</button>
    </div>
    {rounds.length ? <div className="round-list">{rounds.map((round, index) => {
      const complete = round.status === "Completed";
      return <div className={`round-row ${complete ? "complete" : ""}`} key={round.id}>
        <button className="round-check" title={complete ? "Mark upcoming" : "Mark completed"} onClick={() => updateRound(round.id, { status: complete ? "Upcoming" : "Completed" })}>{complete ? <Check size={14} /> : <span>{index + 1}</span>}</button>
        <label className="round-name"><span>Phase {index + 1}</span><input value={round.name} onChange={(event) => updateRound(round.id, { name: event.target.value })} /></label>
        <label className="round-date"><span><CalendarDays size={11} /> Date</span><input type="date" value={round.date || ""} onChange={(event) => updateRound(round.id, { date: event.target.value })} /></label>
        <span className={`round-state ${complete ? "done" : ""}`}>{round.status}</span>
        <button className="icon-button danger" title="Remove phase" onClick={() => removeRound(round.id)}><Trash2 size={14} /></button>
      </div>;
    })}</div> : <div className="round-empty"><CalendarDays size={21} /><div><strong>No interview phases yet</strong><span>Add the recruiter screen or your next scheduled round.</span></div></div>}
  </section>;
}
