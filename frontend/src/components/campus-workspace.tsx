"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAppData } from "@/context/AppContext";
import {
  workspaceApi,
  errorMessage,
  type Drive,
  type Overview,
} from "@/lib/workspace";

interface Student {
  drive_id: number;
  user_id: number;
  name: string;
  email: string;
  college: string;
  title: string;
  status: string;
}
export default function CampusWorkspace({
  overview,
  reload,
}: {
  overview: Overview;
  reload: () => Promise<void>;
}) {
  const { user } = useAppData();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [owned, setOwned] = useState<{ drives: Drive[]; students: Student[] }>({
    drives: [],
    students: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consents, setConsents] = useState<Record<number, boolean>>({});
  const campus = overview.entitlements.some((plan) => plan.plan === "college");
  async function load() {
    try {
      setDrives((await workspaceApi("/drives")).data);
      if (user?.role === "recruiter")
        setOwned((await workspaceApi("/campus")).data);
      setError("");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  useEffect(() => {
    void load();
  }, [user?.role]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await workspaceApi("/drives", "POST", {
        ...fields,
        graduation_year: Number(fields.graduation_year),
      });
      toast.success("Placement drive published");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function register(driveId: number, withdraw: boolean) {
    setBusy(true);
    try {
      await workspaceApi(
        `/drives/${driveId}/register`,
        withdraw ? "DELETE" : "POST",
        { consent: consents[driveId] === true },
      );
      await reload();
      toast.success(
        withdraw ? "Registration withdrawn" : "Registered for the drive",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function status(student: Student, value: string) {
    setBusy(true);
    try {
      await workspaceApi(
        `/drives/${student.drive_id}/student/${student.user_id}`,
        "PUT",
        { status: value },
      );
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const cell = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""')}"`;
    const rows = [
      ["Name", "Email", "College", "Drive", "Status"],
      ...owned.students.map((item) => [
        item.name,
        item.email,
        item.college,
        item.title,
        item.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hireheaven-placements.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="workspace-stack">
      <section className="workspace-card">
        <span className="workspace-kicker">HireHeaven campus</span>
        <h2>First opportunities. Lasting beginnings.</h2>
        <p>Placement drives connect graduating students with hiring teams.</p>
        {error && <p role="alert">{error}</p>}
        {user?.role === "recruiter" &&
          (campus ? (
            <form onSubmit={create} className="workspace-form">
              <div className="workspace-grid">
                <label>
                  College
                  <input name="college" required maxLength={150} />
                </label>
                <label>
                  Drive title
                  <input name="title" required maxLength={150} />
                </label>
                <label>
                  Graduation year
                  <input
                    name="graduation_year"
                    type="number"
                    required
                    min={2000}
                    max={2100}
                  />
                </label>
                <label>
                  Registration deadline
                  <input
                    type="date"
                    name="deadline"
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </label>
              </div>
              <label>
                Eligibility and opportunities
                <textarea
                  name="description"
                  required
                  maxLength={4000}
                  rows={4}
                />
              </label>
              <button disabled={busy}>Publish placement drive</button>
            </form>
          ) : (
            <p>
              <Link href="/subscribe">
                Choose Campus to organise drives and track placements →
              </Link>
            </p>
          ))}
        {!drives.length && <p>No open placement drives yet.</p>}
        {drives.map((drive) => {
          const registration = overview.registrations.find(
            (item) => item.drive_id === drive.id,
          );
          return (
            <article className="workspace-drive" key={drive.id}>
              <span className="workspace-chip">
                Class of {drive.graduation_year}
              </span>
              <h3>{drive.title}</h3>
              <p>
                {drive.college} · Organised by {drive.organiser}
              </p>
              <p className="whitespace-pre-wrap">{drive.description}</p>
              <p>Register by {new Date(drive.deadline).toLocaleDateString()}</p>
              {user?.role === "jobseeker" && (
                <>
                  {registration ? (
                    <>
                      <p>Your status · {registration.status}</p>
                      <button
                        disabled={busy}
                        onClick={() => void register(drive.id, true)}
                      >
                        Withdraw registration
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="workspace-checkbox">
                        <input
                          type="checkbox"
                          checked={consents[drive.id] ?? false}
                          onChange={(event) =>
                            setConsents({
                              ...consents,
                              [drive.id]: event.target.checked,
                            })
                          }
                        />{" "}
                        Share my name and email with this drive’s organiser
                      </label>
                      <button
                        disabled={busy || !consents[drive.id]}
                        onClick={() => void register(drive.id, false)}
                      >
                        Register for drive
                      </button>
                    </>
                  )}
                </>
              )}
            </article>
          );
        })}
      </section>
      {user?.role === "recruiter" && (
        <section className="workspace-card">
          <h2>Your placement report.</h2>
          <div className="workspace-summary">
            <div>
              <strong>{owned.drives.length}</strong>
              <span>Drives</span>
            </div>
            <div>
              <strong>{owned.students.length}</strong>
              <span>Registrations</span>
            </div>
            <div>
              <strong>
                {
                  owned.students.filter((item) => item.status === "Placed")
                    .length
                }
              </strong>
              <span>Placements</span>
            </div>
          </div>
          <button disabled={!owned.students.length} onClick={download}>
            Export report as CSV
          </button>
          <div className="workspace-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Drive</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {owned.students.map((student) => (
                  <tr key={`${student.drive_id}-${student.user_id}`}>
                    <td>
                      {student.name}
                      <small>{student.email}</small>
                    </td>
                    <td>{student.title}</td>
                    <td>
                      <select
                        aria-label={`Placement status for ${student.name}`}
                        value={student.status}
                        disabled={busy}
                        onChange={(event) =>
                          void status(student, event.target.value)
                        }
                      >
                        {[
                          "Registered",
                          "Shortlisted",
                          "Interview",
                          "Placed",
                        ].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
