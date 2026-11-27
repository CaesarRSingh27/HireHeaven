"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import Cookies from "js-cookie";
import { job_service } from "@/context/AppContext";
import {
  errorMessage,
  workspaceApi,
  type Applicant,
  type HiringData,
} from "@/lib/workspace";
import CalendarActions from "@/components/calendar-actions";
import ResumeDownload from "@/components/resume-download";

const stages = ["Submitted", "Shortlisted", "Interview", "Hired", "Rejected"];
export default function HiringWorkspace() {
  const [data, setData] = useState<HiringData | null>(null);
  const [error, setError] = useState("");
  const [job, setJob] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      setData((await workspaceApi("/recruiter")).data);
      setError("");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function update(applicant: Applicant, status: string, note?: string) {
    setBusy(true);
    try {
      await axios.put(
        `${job_service}/api/job/application/update/${applicant.application_id}`,
        { status, ...(note === undefined ? {} : { recruiter_note: note }) },
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } },
      );
      toast.success("Applicant updated");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <section className="workspace-card">
        <p role="alert">{error}</p>
        <button onClick={() => void load()}>Retry</button>
      </section>
    );
  if (!data) return <p role="status">Loading your hiring workspace…</p>;
  const applications = data.applications.filter(
    (item) =>
      (!job || item.job_id === Number(job)) &&
      (!stage || item.status === stage) &&
      `${item.applicant_name} ${item.skills.join(" ")} ${item.job_title}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const views = data.jobs.reduce((sum, item) => sum + item.views, 0);
  return (
    <div className="workspace-stack">
      <div className="workspace-summary">
        {stages.map((item) => (
          <div key={item}>
            <strong>{data.funnel[item] ?? 0}</strong>
            <span>{item === "Submitted" ? "Applied" : item}</span>
          </div>
        ))}
      </div>
      <section className="workspace-card">
        <span className="workspace-kicker">Your hiring pipeline</span>
        <h2>Good people. Clear next steps.</h2>
        <div className="workspace-grid">
          <label>
            Role
            <select
              value={job}
              onChange={(event) => setJob(event.target.value)}
            >
              <option value="">All jobs</option>
              {data.jobs.map((item) => (
                <option key={item.job_id} value={item.job_id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name or skill
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applicants"
            />
          </label>
          <label>
            Stage
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
            >
              <option value="">All stages</option>
              {stages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        {!applications.length && (
          <p>
            No applicants match these filters.{" "}
            <Link href="/account">Manage companies and post a role →</Link>
          </p>
        )}
        <div className="workspace-pipeline">
          {stages
            .filter((item) => !stage || stage === item)
            .map((item) => (
              <div className="workspace-lane" key={item}>
                <h3>{item === "Submitted" ? "Applied" : item}</h3>
                {applications
                  .filter((applicant) => applicant.status === item)
                  .map((applicant) => (
                    <article
                      className="workspace-applicant"
                      key={applicant.application_id}
                    >
                      <Link href={`/account/${applicant.applicant_id}`}>
                        <strong>{applicant.applicant_name}</strong>
                      </Link>
                      <small>{applicant.job_title}</small>
                      <small className="application-response-age">Last updated {new Date(applicant.updated_at || applicant.applied_at).toLocaleDateString()}</small>
                      {applicant.status === "Submitted" && Math.floor((Date.now() - new Date(applicant.updated_at || applicant.applied_at).getTime()) / 86400000) >= 7 && <span className="workspace-chip response-overdue">Waiting {Math.floor((Date.now() - new Date(applicant.updated_at || applicant.applied_at).getTime()) / 86400000)} days · Consider an update</span>}
                      <p>
                        {applicant.skills.join(" · ") || "No skills listed"}
                      </p>
                      <ResumeDownload applicationId={applicant.application_id} />
                      <label>
                        Stage
                        <select
                          disabled={busy}
                          value={applicant.status}
                          onChange={(event) =>
                            void update(applicant, event.target.value)
                          }
                        >
                          {stages.map((stage) => (
                            <option key={stage}>{stage}</option>
                          ))}
                        </select>
                      </label>
                      <ApplicantNote
                        applicant={applicant}
                        busy={busy}
                        save={(note) =>
                          update(applicant, applicant.status, note)
                        }
                      />
                      <details className="workspace-schedule-details">
                        <summary>Propose an interview time</summary>
                        <ScheduleInterviewForm applicant={applicant} reload={load} />
                      </details>
                    </article>
                  ))}
              </div>
            ))}
        </div>
      </section>
      <section className="workspace-card" id="interviews">
        <span className="workspace-kicker">Interview calendar</span>
        <h2>Keep every conversation moving.</h2>
        {!data.meetings.length && <p>Interview proposals and confirmations will appear here.</p>}
        {data.meetings.map((meeting) => (
          <article className="workspace-row workspace-meeting-row" key={meeting.id}>
            <div><strong>{meeting.job_title}</strong><small>{meeting.candidate_name} · {new Date(meeting.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small><span className="workspace-chip">{meeting.status}</span></div>
            <div className="workspace-meeting-actions">
              {meeting.meeting_url && <a href={meeting.meeting_url} target="_blank" rel="noreferrer">Open meeting ↗</a>}
              {(meeting.status === "Proposed" || meeting.status === "Accepted") && <CalendarActions meeting={meeting} />}
              {meeting.status === "Proposed" || meeting.status === "Accepted" ? <button type="button" onClick={async () => {
                try { await workspaceApi(`/meetings/${meeting.id}/cancel`, "POST"); toast.success("Interview cancelled"); await load(); }
                catch (error) { toast.error(errorMessage(error)); }
              }}>Cancel</button> : null}
            </div>
          </article>
        ))}
      </section>
      <section className="workspace-card">
        <span className="workspace-kicker">Recruiter analytics</span>
        <h2>Understand your hiring flow.</h2>
        <div className="workspace-summary">
          <div>
            <strong>{views}</strong>
            <span>Daily unique listing views</span>
          </div>
          <div>
            <strong>{data.applications.length}</strong>
            <span>Applications</span>
          </div>
          <div>
            <strong>
              {views
                ? `${Math.round((data.applications.length / views) * 100)}%`
                : "—"}
            </strong>
            <span>Applications / recorded views</span>
          </div>
          <div>
            <strong>{data.funnel.Hired ?? 0}</strong>
            <span>Hires</span>
          </div>
        </div>
        <p>
          Views count each browser signature once per job per day, starting when
          this feature was added. Applications include earlier records.
        </p>
        {data.pro ? (
          <>
            <h3>Weekly applications</h3>
            {!data.analytics.length && (
              <p>Your first application will start this chart.</p>
            )}
            {data.analytics.map((item) => (
              <div className="workspace-chart-row" key={item.week}>
                <span>{new Date(item.week).toLocaleDateString()}</span>
                <meter
                  min={0}
                  max={Math.max(
                    1,
                    ...data.analytics.map((row) => row.applications),
                  )}
                  value={item.applications}
                />
                <strong>{item.applications}</strong>
              </div>
            ))}
            <p>
              {data.engagement[0]?.returning_applicants ?? 0} applicants
              returned to their workspace on a later day within the past 30
              days.
            </p>
          </>
        ) : (
          <p>
            <Link href="/subscribe">
              Unlock weekly trends with Recruiter Pro →
            </Link>
          </p>
        )}
        <div className="workspace-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Views</th>
                <th>Applicants</th>
                <th>Promotion</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((item) => (
                <tr key={item.job_id}>
                  <td>
                    <Link href={`/jobs/${item.job_id}`}>{item.title}</Link>
                  </td>
                  <td>{item.views}</td>
                  <td>{item.applications}</td>
                  <td>
                    {item.featured_until &&
                    new Date(item.featured_until) > new Date() ? (
                      `Featured until ${new Date(item.featured_until).toLocaleDateString()}`
                    ) : (
                      <Link href={`/subscribe?job=${item.job_id}`}>
                        Promote job →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ScheduleInterviewForm({ applicant, reload }: { applicant: Applicant; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    try {
      await workspaceApi("/meetings", "POST", {
        application_id: applicant.application_id,
        scheduled_at: new Date(String(fields.get("scheduled_at"))).toISOString(),
        meeting_url: fields.get("meeting_url"),
      });
      toast.success(`Interview invite sent to ${applicant.applicant_name}`);
      form.reset();
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="workspace-form">
    <label>Time<input name="scheduled_at" type="datetime-local" required /></label>
    <label>Meeting link (optional)<input name="meeting_url" type="url" placeholder="https://meet.example.com/…" /></label>
    <button disabled={busy}>{busy ? "Sending invite…" : "Send interview invite"}</button>
    <small>The candidate can accept or decline. Invitations and 24-hour reminders use the configured email service.</small>
  </form>;
}

function ApplicantNote({
  applicant,
  busy,
  save,
}: {
  applicant: Applicant;
  busy: boolean;
  save: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(applicant.recruiter_note);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save(note);
      }}
    >
      <label>
        Private note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={4000}
          rows={3}
        />
      </label>
      <button disabled={busy || note === applicant.recruiter_note}>
        Save note
      </button>
    </form>
  );
}
