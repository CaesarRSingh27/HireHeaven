"use client";

import axios from "axios";
import type { Job } from "@/type";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAppData, job_service } from "@/context/AppContext";
import {
  errorMessage,
  workspaceApi,
  type Overview,
  type Portfolio,
  type Interview,
} from "@/lib/workspace";
import CalendarActions from "@/components/calendar-actions";

export default function CandidateWorkspace({
  data,
  reload,
}: {
  data: Overview;
  reload: () => Promise<void>;
}) {
  const { user } = useAppData();
  const [portfolio, setPortfolio] = useState<Portfolio>(
    data.portfolio ?? {
      headline: "",
      github: "",
      projects: [],
      theme: "classic",
      slug: String(user?.user_id),
      is_public: false,
    },
  );
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<Interview | null>(
    data.interviews[0] ?? null,
  );
  const [answer, setAnswer] = useState(session?.answer ?? "");
  const paid = data.entitlements.some((plan) => plan.plan === "career");
  const profileSteps = [
    { label: "Add a short professional introduction", done: Boolean(user?.bio?.trim()), href: "/account" },
    { label: "List at least three skills", done: (user?.skills?.length ?? 0) >= 3, href: "/account" },
    { label: "Upload a current resume", done: Boolean(user?.resume), href: "/account" },
    { label: "Add a project or portfolio link", done: Boolean(data.portfolio?.projects?.length || data.portfolio?.github?.trim()), href: "/workspace#portfolio" },
  ];
  const profileProgress = Math.round(profileSteps.filter((step) => step.done).length / profileSteps.length * 100);

  async function savePortfolio(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await workspaceApi("/portfolio", "PUT", portfolio);
      toast.success("Portfolio saved");
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function alert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await workspaceApi("/alerts", "POST", {
        ...Object.fromEntries(fields),
        email_enabled: fields.get("email_enabled") === "on",
      });
      toast.success("Job alert saved");
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await workspaceApi("/interview", "POST", {
        job_id: Number(fields.get("job_id")),
      });
      setSession(result.data);
      setAnswer("");
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function submitAnswer(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      const result = await workspaceApi(
        `/interview/${session.id}/answer`,
        "POST",
        { answer },
      );
      setSession({ ...session, answer, feedback: result.data.feedback });
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove(path: string) {
    try {
      await workspaceApi(path, "DELETE");
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="workspace-stack">
      <div className="workspace-summary">
        <div>
          <strong>{data.saved.length}</strong>
          <span>Saved roles</span>
        </div>
        <div>
          <strong>{data.alerts.length}</strong>
          <span>Job alerts</span>
        </div>
        <div>
          <strong>
            {data.usage.find((item) => item.feature === "interview")?.count ??
              0}{" "}
            / {paid ? 100 : 3}
          </strong>
          <span>Interview questions this month</span>
        </div>
        <div>
          <strong>{paid ? "Career Plus" : "Free"}</strong>
          <Link href="/subscribe">Explore plans →</Link>
        </div>
      </div>
      <section className="workspace-card profile-completion-card">
        <div className="workspace-row"><div><span className="workspace-kicker">Candidate profile guide</span><h2>Make your strengths easy to spot.</h2></div><strong>{profileProgress}% complete</strong></div>
        <p>A complete profile gives hiring teams a clearer picture of your experience.</p>
        <div className="profile-progress-track" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileProgress}><span style={{ width: `${profileProgress}%` }} /></div>
        <ul className="profile-checklist">{profileSteps.map((step) => <li key={step.label}><span aria-hidden="true">{step.done ? "✓" : "○"}</span><Link href={step.href} className={step.done ? "is-complete" : ""}>{step.label}</Link>{!step.done && <Link href={step.href} className="profile-step-action">Add →</Link>}</li>)}</ul>
      </section>
      <div className="workspace-grid">
        <section className="workspace-card">
          <h2>Your shortlist.</h2>
          <p>Keep opportunities worth coming back to.</p>
          {!data.saved.length && (
            <p>Use Save on any job card to start your shortlist.</p>
          )}
          {data.saved.map((job) => (
            <div className="workspace-row" key={job.job_id}>
              <Link href={`/jobs/${job.job_id}`}>
                <strong>{job.title}</strong>
                <small>
                  {job.company_name} ·{" "}
                  {job.is_active ? job.location : "Applications closed"}
                </small>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await workspaceApi(`/saved/${job.job_id}`, "PUT", {
                      saved: false,
                    });
                    await reload();
                  } catch (error) {
                    toast.error(errorMessage(error));
                  }
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </section>
        <section className="workspace-card">
          <h2>A little heads-up.</h2>
          <p>New openings matching your alerts appear here when you return.</p>
          <form onSubmit={alert} className="workspace-form">
            <label>
              Role
              <input
                name="title"
                placeholder="Frontend developer"
                maxLength={120}
              />
            </label>
            <label>
              Location
              <input
                name="location"
                placeholder="Delhi or Remote"
                maxLength={120}
              />
            </label>
            <label>
              Email digest
              <select name="frequency" defaultValue="daily">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label className="workspace-checkbox">
              <input name="email_enabled" type="checkbox" /> Email me when matching roles are found
            </label>
            <button disabled={busy}>Save alert</button>
          </form>
          {data.alerts.map((item) => (
            <div className="workspace-row" key={item.id}>
              <span>
                {item.title || "Any role"} · {item.location || "Anywhere"}{item.email_enabled ? ` · ${item.frequency} email` : " · in-app only"}
              </span>
              <button onClick={() => void remove(`/alerts/${item.id}`)}>
                Remove
              </button>
            </div>
          ))}
          {data.matches.map((job) => (
            <Link
              className="workspace-row"
              href={`/jobs/${job.job_id}`}
              key={job.job_id}
            >
              {job.title} · {job.company_name} →
            </Link>
          ))}
        </section>
      </div>
      <section className="workspace-card">
        <span className="workspace-kicker">Your application journey</span>
        <h2>Every next step, in one place.</h2>
        <p>Follow each role from the day you applied through every recruiter update.</p>
        {!data.updates.length && (
          <p>Status changes from recruiters will appear here.</p>
        )}
        {data.updates.map((update) => (
          <article className="workspace-tracker-card" key={update.application_id}>
            <div className="workspace-row workspace-tracker-heading">
              <strong>{update.title}</strong>
              <span className="workspace-chip">{update.status}</span>
            </div>
            <small>Applied {new Date(update.applied_at).toLocaleDateString()} · Last updated {new Date(update.updated_at || update.applied_at).toLocaleDateString()}</small>
            <ol className="workspace-timeline">
              {update.timeline.map((event, index) => (
                <li key={`${event.created_at}-${index}`}>
                  <span className="workspace-timeline-dot" />
                  <span><strong>{event.status}</strong><small>{event.note}</small></span>
                  <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString()}</time>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
      <section className="workspace-card" id="interview-schedule">
        <span className="workspace-kicker">Interview calendar</span>
        <h2>Make room for what’s next.</h2>
        <p>Review invitations from hiring teams and keep the details close.</p>
        {!data.meetings.length && <p>Interview invitations and meeting details will appear here.</p>}
        {data.meetings.map((meeting) => (
          <article className="workspace-row workspace-meeting-row" key={meeting.id}>
            <div><strong>{meeting.job_title}</strong><small>{meeting.recruiter_name ? `With ${meeting.recruiter_name} · ` : ""}{new Date(meeting.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small><span className="workspace-chip">{meeting.status}</span></div>
            <div className="workspace-meeting-actions">
              {meeting.meeting_url && <a href={meeting.meeting_url} target="_blank" rel="noreferrer">Open meeting ↗</a>}
              {(meeting.status === "Proposed" || meeting.status === "Accepted") && <CalendarActions meeting={meeting} />}
              {meeting.status === "Proposed" && <><button type="button" onClick={() => void respondToMeeting(meeting.id, true, reload)}>Accept</button><button type="button" onClick={() => void respondToMeeting(meeting.id, false, reload)}>Decline</button></>}
            </div>
          </article>
        ))}
      </section>
      <section className="workspace-card" id="interview">
        <span className="workspace-kicker">Reze interview studio</span>
        <h2>Walk in prepared.</h2>
        <p>
          Practise a question tailored to a real listing, then receive feedback
          on your answer. Each question includes one feedback response.
        </p>
        <InterviewJobPicker busy={busy} onSubmit={startInterview} />
        {session && (
          <div className="workspace-result">
            <h3>Your question</h3>
            <p className="whitespace-pre-wrap">{session.question}</p>
            {session.feedback && session.feedback !== "Preparing feedback" ? (
              <>
                <h3>Your answer</h3>
                <p className="whitespace-pre-wrap">{session.answer}</p>
                <h3>Reze’s feedback</h3>
                <p className="whitespace-pre-wrap">{session.feedback}</p>
              </>
            ) : session.feedback === "Preparing feedback" ? (
              <p>Feedback is being prepared. Refresh the workspace shortly.</p>
            ) : (
              <form onSubmit={submitAnswer} className="workspace-form">
                <label>
                  Your answer
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    maxLength={6000}
                    required
                    rows={5}
                  />
                </label>
                <button disabled={busy}>
                  {busy ? "Preparing feedback…" : "Get feedback"}
                </button>
              </form>
            )}
          </div>
        )}
        {data.interviews.length > 1 && (
          <details>
            <summary>Previous practice sessions</summary>
            {data.interviews.map((item) => (
              <button
                className="workspace-row"
                key={item.id}
                onClick={() => {
                  setSession(item);
                  setAnswer(item.answer);
                }}
              >
                {item.question.slice(0, 120)}…
              </button>
            ))}
          </details>
        )}
      </section>
      <section className="workspace-card" id="portfolio">
        <span className="workspace-kicker">Your work, in focus</span>
        <h2>A page that tells your story.</h2>
        <p>
          Your published portfolio shares your name, bio, skills, and the
          projects below. Email, phone, and resume stay off this page.
        </p>
        <form onSubmit={savePortfolio} className="workspace-form">
          <div className="workspace-grid">
            <label>
              Headline
              <input
                value={portfolio.headline}
                onChange={(event) =>
                  setPortfolio({ ...portfolio, headline: event.target.value })
                }
                maxLength={160}
                placeholder="Frontend developer building thoughtful products"
              />
            </label>
            <label>
              GitHub profile
              <input
                type="url"
                value={portfolio.github}
                onChange={(event) =>
                  setPortfolio({ ...portfolio, github: event.target.value })
                }
                placeholder="https://github.com/yourname"
              />
            </label>
          </div>
          {portfolio.projects.map((project, index) => (
            <div className="workspace-project" key={index}>
              <label>
                Project name
                <input
                  required
                  value={project.title}
                  maxLength={100}
                  onChange={(event) =>
                    setPortfolio({
                      ...portfolio,
                      projects: portfolio.projects.map((item, i) =>
                        i === index
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  value={project.description}
                  maxLength={600}
                  onChange={(event) =>
                    setPortfolio({
                      ...portfolio,
                      projects: portfolio.projects.map((item, i) =>
                        i === index
                          ? { ...item, description: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Project URL
                <input
                  type="url"
                  value={project.url}
                  placeholder="https://…"
                  onChange={(event) =>
                    setPortfolio({
                      ...portfolio,
                      projects: portfolio.projects.map((item, i) =>
                        i === index
                          ? { ...item, url: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setPortfolio({
                    ...portfolio,
                    projects: portfolio.projects.filter((_, i) => i !== index),
                  })
                }
              >
                Remove project
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={portfolio.projects.length >= 8}
            onClick={() =>
              setPortfolio({
                ...portfolio,
                projects: [
                  ...portfolio.projects,
                  { title: "", description: "", url: "" },
                ],
              })
            }
          >
            Add project
          </button>
          <div className="workspace-grid">
            <label>
              Portfolio URL {paid ? "" : "· custom URLs require Career Plus"}
              <input
                disabled={!paid}
                value={portfolio.slug}
                onChange={(event) =>
                  setPortfolio({ ...portfolio, slug: event.target.value })
                }
              />
            </label>
            <label>
              Style
              <select
                value={portfolio.theme}
                disabled={!paid}
                onChange={(event) =>
                  setPortfolio({ ...portfolio, theme: event.target.value })
                }
              >
                <option value="classic">Classic</option>
                <option value="editorial">Editorial · Career Plus</option>
              </select>
            </label>
          </div>
          <label className="workspace-checkbox">
            <input
              type="checkbox"
              checked={portfolio.is_public}
              onChange={(event) =>
                setPortfolio({ ...portfolio, is_public: event.target.checked })
              }
            />{" "}
            Publish my portfolio publicly
          </label>
          <button disabled={busy}>Save portfolio</button>
          {data.portfolio?.is_public && (
            <Link
              href={`/talent/${data.portfolio.slug || user?.user_id}`}
              target="_blank"
            >
              Open your published portfolio ↗
            </Link>
          )}
        </form>
      </section>
    </div>
  );
}

async function respondToMeeting(id: number, accepted: boolean, reload: () => Promise<void>) {
  try {
    await workspaceApi(`/meetings/${id}/respond`, "POST", { accepted });
    toast.success(accepted ? "Interview accepted" : "Interview declined");
    await reload();
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

function InterviewJobPicker({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    axios
      .get(`${job_service}/api/job/all`)
      .then((result) => setJobs(result.data))
      .catch(() =>
        setError("Could not load job listings. Refresh to try again."),
      );
  }, []);
  return (
    <form onSubmit={onSubmit} className="workspace-form">
      <label>
        Choose a job
        <select name="job_id" required defaultValue="">
          <option value="" disabled>
            Select an opening
          </option>
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>
              {job.title} · {job.company_name}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy || !jobs.length}>
        {busy ? "Reze is preparing…" : "Practise with Reze"}
      </button>
    </form>
  );
}
