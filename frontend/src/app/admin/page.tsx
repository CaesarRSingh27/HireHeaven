"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAppData } from "@/context/AppContext";
import { errorMessage, workspaceApi } from "@/lib/workspace";

type AdminData = {
  reports: { id: number; job_id: number; reason: string; status: string; review_note: string; created_at: string; title: string; is_active: boolean; company_name: string; reporter_name: string }[];
  companies: { company_id: number; name: string; website: string; logo: string; created_at: string; is_verified: boolean; recruiter_id: number; recruiter_name: string; recruiter_email: string; listings: number }[];
  users: { user_id: number; name: string; email: string; role: string; is_suspended: boolean; suspension_note: string; created_at: string }[];
  jobs: { job_id: number; title: string; is_active: boolean; moderation_note: string; created_at: string; company_name: string }[];
};

export default function AdminPage() {
  const { user, loading } = useAppData();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      setData((await workspaceApi("/admin/overview")).data);
      setError("");
    } catch (reason) { setError(errorMessage(reason)); }
  }, []);
  useEffect(() => { if (user?.role === "admin") void load(); }, [user?.role, load]);

  async function act(key: string, path: string, method: string, payload: unknown, success: string) {
    setBusy(key);
    try { await workspaceApi(path, method, payload); toast.success(success); await load(); }
    catch (reason) { toast.error(errorMessage(reason)); }
    finally { setBusy(""); }
  }

  if (loading) return <main className="workspace-page"><p role="status">Checking administrator access…</p></main>;
  if (user?.role !== "admin") return <main className="workspace-page"><section className="workspace-card admin-access-card"><span className="workspace-kicker">Restricted area</span><h1>Administrator access required.</h1><p>Sign in with an authorized HireHeaven admin account to review platform activity.</p><Link href={user ? "/workspace" : "/login"}>{user ? "Return to workspace →" : "Sign in →"}</Link></section></main>;

  return <main className="workspace-page admin-page">
    <header className="workspace-heading"><span className="workspace-kicker">HireHeaven operations</span><h1>Trust, safety & <em>verification.</em></h1><p>Review flagged openings, confirm company identities, and respond to account concerns.</p></header>
    {error && <section className="workspace-card"><p role="alert">{error}</p><button onClick={() => void load()}>Retry</button></section>}
    {!data && !error && <p role="status">Loading moderation queue…</p>}
    {data && <div className="workspace-stack">
      <div className="workspace-summary"><div><strong>{data.reports.filter((item) => item.status === "Pending").length}</strong><span>Open reports</span></div><div><strong>{data.companies.filter((item) => !item.is_verified).length}</strong><span>Companies to verify</span></div><div><strong>{data.users.filter((item) => item.is_suspended).length}</strong><span>Suspended accounts</span></div><div><strong>{data.jobs.filter((item) => !item.is_active).length}</strong><span>Paused listings</span></div></div>

      <section className="workspace-card admin-section"><div className="admin-section-heading"><div><span className="workspace-kicker">Community flags</span><h2>Reported job listings</h2></div><span className="workspace-chip">{data.reports.filter((item) => item.status === "Pending").length} pending</span></div>
        {!data.reports.length && <p>No listing reports yet.</p>}
        {data.reports.map((report) => <article className="admin-review-row" key={report.id}><div className="admin-review-copy"><strong>{report.title} · {report.company_name}</strong><p>{report.reason}</p><small>Reported by {report.reporter_name} · {new Date(report.created_at).toLocaleString()}</small>{report.review_note && <small>Review note: {report.review_note}</small>}</div>{report.status === "Pending" ? <AdminNoteAction busy={busy === `report-${report.id}`} label="Review report" actionLabel="Mark reviewed" secondaryLabel="Dismiss report" onSubmit={(note) => act(`report-${report.id}`, `/admin/reports/${report.id}`, "PUT", { status: "Reviewed", review_note: note }, "Report marked reviewed")} onSecondary={() => act(`report-${report.id}`, `/admin/reports/${report.id}`, "PUT", { status: "Dismissed", review_note: "No policy issue found" }, "Report dismissed")} /> : <span className="workspace-chip">{report.status}</span>}</article>)}
      </section>

      <section className="workspace-card admin-section"><div className="admin-section-heading"><div><span className="workspace-kicker">Recruiter trust</span><h2>Company verification</h2></div></div>
        {!data.companies.length && <p>Recruiters have not added companies yet.</p>}
        {data.companies.map((company) => <article className="admin-review-row" key={company.company_id}><div className="admin-review-copy"><strong>{company.name} {company.is_verified && <span className="verified-company-badge">✓ Verified</span>}</strong><p>{company.recruiter_name} · {company.recruiter_email}</p><small>{company.website} · {company.listings} listing{company.listings === 1 ? "" : "s"}</small></div><button disabled={busy === `company-${company.company_id}`} onClick={() => void act(`company-${company.company_id}`, `/admin/companies/${company.company_id}/verify`, "PUT", { verified: !company.is_verified }, company.is_verified ? "Verification removed" : "Company verified")}>{company.is_verified ? "Remove verification" : "Verify company"}</button></article>)}
      </section>

      <section className="workspace-card admin-section"><div className="admin-section-heading"><div><span className="workspace-kicker">Account safety</span><h2>Suspicious accounts</h2></div></div>
        {data.users.map((account) => <article className="admin-review-row" key={account.user_id}><div className="admin-review-copy"><strong>{account.name} <span className="workspace-chip">{account.role}</span></strong><p>{account.email}</p><small>{account.is_suspended ? `Suspended: ${account.suspension_note}` : `Joined ${new Date(account.created_at).toLocaleDateString()}`}</small></div><AdminNoteAction busy={busy === `user-${account.user_id}`} label={account.is_suspended ? "Reinstate account" : "Suspend account"} actionLabel="Suspend" secondaryLabel="Cancel" disabled={account.is_suspended} onSubmit={(note) => act(`user-${account.user_id}`, `/admin/users/${account.user_id}/suspension`, "PUT", { suspended: true, note }, "Account suspended")} onSecondary={() => act(`user-${account.user_id}`, `/admin/users/${account.user_id}/suspension`, "PUT", { suspended: false }, "Account reinstated")} /></article>)}
      </section>

      <section className="workspace-card admin-section"><div className="admin-section-heading"><div><span className="workspace-kicker">Listing moderation</span><h2>Active job openings</h2></div></div>
        {data.jobs.map((job) => <article className="admin-review-row" key={job.job_id}><div className="admin-review-copy"><strong>{job.title} · {job.company_name}</strong><small>{job.moderation_note || `Posted ${new Date(job.created_at).toLocaleDateString()}`}</small></div><button disabled={busy === `job-${job.job_id}`} onClick={() => { const note = job.is_active ? window.prompt("Reason for pausing this listing (at least 5 characters):") : ""; if (job.is_active && (!note || note.trim().length < 5)) return; void act(`job-${job.job_id}`, `/admin/jobs/${job.job_id}/suspension`, "PUT", { suspended: job.is_active, note: note ?? "" }, job.is_active ? "Listing paused" : "Listing restored"); }}>{job.is_active ? "Pause listing" : "Restore listing"}</button></article>)}
      </section>
    </div>}
  </main>;
}

function AdminNoteAction({ busy, label, actionLabel, secondaryLabel, onSubmit, onSecondary, disabled = false }: { busy: boolean; label: string; actionLabel: string; secondaryLabel: string; onSubmit: (note: string) => Promise<void>; onSecondary: () => Promise<void>; disabled?: boolean }) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  if (disabled) return <button disabled={busy} onClick={() => void onSecondary()}>{label}</button>;
  return <div className="admin-row-actions">{open && <textarea aria-label="Review note" placeholder="Add a short internal note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />}
    <button disabled={busy || (open && label === "Suspend account" && note.trim().length < 5)} onClick={() => { if (!open) { setOpen(true); return; } void onSubmit(note); }}>{busy ? "Saving…" : open ? actionLabel : label}</button>
    {open && <button className="admin-secondary-action" disabled={busy} onClick={() => { if (label === "Review report") void onSecondary(); else { setOpen(false); setNote(""); } }}>{secondaryLabel}</button>}
  </div>;
}
