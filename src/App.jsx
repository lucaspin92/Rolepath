import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Menu } from "lucide-react";
import AddModal from "./AddModal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Detail from "./Detail.jsx";
import { api, blankProfile, Logo, Sidebar, Toast } from "./lib.jsx";
import { ApplicationsPage, Dashboard, InterviewsPage } from "./pages.jsx";
import ProfilePage from "./ProfilePage.jsx";
import SettingsPage from "./SettingsPage.jsx";

export default function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState({ connected: false, authMode: "none", message: "Checking Codex connection…" });
  const [toastState, setToastState] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [profile, setProfile] = useState(() => { try { return { ...blankProfile, ...JSON.parse(localStorage.getItem("rolepath-profile")) }; } catch { return blankProfile; } });
  const selected = applications.find((x) => x.id === selectedId);
  const counts = useMemo(() => ({ all: applications.length, interviews: applications.filter((x) => x.status === "Interview" || x.interviewRounds?.length).length }), [applications]);
  useEffect(() => { Promise.all([api("/api/applications"), api("/api/health")]).then(([items, health]) => { setApplications(items); setAgentStatus(health.agent || { connected: Boolean(health.aiEnabled), authMode: "none" }); }).catch((e) => showToast(e.message, true)).finally(() => setLoading(false)); }, []);
  const aiEnabled = agentStatus.connected;
  function showToast(message, error = false) { setToastState({ message, error }); setTimeout(() => setToastState(null), 3000); }
  function confirmAction(options) { return new Promise((resolve) => setConfirmation({ ...options, resolve })); }
  function resolveConfirmation(value) { const current = confirmation; setConfirmation(null); current?.resolve(value); }
  function openApplication(item) { if (item) { setSelectedId(item.id); setMobileOpen(false); } }
  function handleCreated(item) { setApplications((items) => [item, ...items]); setSelectedId(item.id); setPage("applications"); }
  async function update(id, changes) { const updated = await api(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify(changes) }); setApplications((items) => items.map((x) => x.id === id ? updated : x)); return updated; }
  function replaceApplication(application) { setApplications((items) => items.map((item) => item.id === application.id ? application : item)); }
  async function remove(id) {
    const approved = await confirmAction({ eyebrow: "Delete application", title: "Remove this application?", message: "This permanently deletes its cover letter, interview preparation, conversation, and private notes.", confirmLabel: "Delete application" });
    if (!approved) return false;
    try { await api(`/api/applications/${id}`, { method: "DELETE" }); setApplications((items) => items.filter((x) => x.id !== id)); setSelectedId(null); showToast("Application deleted"); return true; }
    catch (error) { showToast(error.message, true); return false; }
  }
  function go(next) { setSelectedId(null); setPage(next); }
  if (loading) return <div className="app-loader"><Logo /><LoaderCircle className="spin" size={22} /></div>;
  if (selected) return <><Detail application={selected} onBack={() => setSelectedId(null)} update={update} replace={replaceApplication} remove={remove} profile={profile} toast={showToast} aiEnabled={aiEnabled} openSettings={() => go("settings")} /><ConfirmDialog confirmation={confirmation} resolve={resolveConfirmation} /><Toast toast={toastState} /></>;
  return <div className="app-shell"><Sidebar page={page} setPage={go} counts={counts} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} /><div className="page-shell"><div className="mobile-header"><button onClick={() => setMobileOpen(true)}><Menu size={20} /></button><Logo /></div>
    {page === "dashboard" && <Dashboard applications={applications} onAdd={() => setModalOpen(true)} openApplication={openApplication} goApplications={() => setPage("applications")} />}
    {page === "applications" && <ApplicationsPage applications={applications} onAdd={() => setModalOpen(true)} openApplication={openApplication} update={update} remove={remove} toast={showToast} />}
    {page === "interviews" && <InterviewsPage applications={applications} openApplication={openApplication} onAdd={() => setModalOpen(true)} />}
    {page === "profile" && <ProfilePage profile={profile} setProfile={setProfile} aiEnabled={aiEnabled} openSettings={() => go("settings")} />}
    {page === "settings" && <SettingsPage agentStatus={agentStatus} onStatusChange={setAgentStatus} toast={showToast} />}
  </div>{modalOpen && <AddModal close={() => setModalOpen(false)} onCreated={handleCreated} profile={profile} toast={showToast} aiEnabled={aiEnabled} openSettings={() => { setModalOpen(false); go("settings"); }} />}<ConfirmDialog confirmation={confirmation} resolve={resolveConfirmation} /><Toast toast={toastState} /></div>;
}
