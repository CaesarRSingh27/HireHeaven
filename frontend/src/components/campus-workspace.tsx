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

const placementStages = ["Registered", "Shortlisted", "Interview", "Placed"];
const attendanceOptions = ["Unmarked", "Attended", "Absent"] as const;
type Attendance = (typeof attendanceOptions)[number];

interface Student {
  drive_id: number;
  user_id: number;
  name: string;
  email: string;
  college: string;
  title: string;
  status: string;
  attendance: Attendance;
}

function placementRate(placed: number, registered: number) {
  return registered ? `${Math.round(100 * placed / registered)}%` : "—";
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
  const [owned, setOwned] = useState<{ drives: Drive[]; students: Student[]; canTrack: boolean }>({
    drives: [],
    students: [],
    canTrack: false,
  });
  const [selectedDrive, setSelectedDrive] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
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
  async function updateRegistration(student: Student, changes: { status?: string; attendance?: Attendance }) {
    setBusy(true);
    try {
      await workspaceApi(
        `/drives/${student.drive_id}/student/${student.user_id}`,
        "PUT",
        changes,
      );
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const studentsById = new Map<number, Student[]>();
  const driveCounts = new Map<number, { registered: number; attended: number; absent: number; placed: number }>();
  for (const registration of owned.students) {
    const progress = studentsById.get(registration.user_id) ?? [];
    progress.push(registration);
    studentsById.set(registration.user_id, progress);
    const counts = driveCounts.get(registration.drive_id) ?? { registered: 0, attended: 0, absent: 0, placed: 0 };
    counts.registered++;
    if (registration.attendance === "Attended") counts.attended++;
    if (registration.attendance === "Absent") counts.absent++;
    if (registration.status === "Placed") counts.placed++;
    driveCounts.set(registration.drive_id, counts);
  }
  const placedStudents = [...studentsById.values()].filter(progress => progress.some(item => item.status === "Placed")).length;
  const search = studentSearch.trim().toLowerCase();
  const visibleRegistrations = owned.students.filter(item =>
    (!selectedDrive || String(item.drive_id) === selectedDrive) &&
    (!search || `${item.name} ${item.email}`.toLowerCase().includes(search))
  );
  const visibleStudents = Array.from(new Set(visibleRegistrations.map(item => item.user_id)));
  function download() {
    const cell = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""')}"`;
    const rows = [
      ["Name", "Email", "College", "Drive", "Attendance", "Status"],
      ...visibleRegistrations.map((item) => [
        item.name,
        item.email,
        item.college,
        item.title,
        item.attendance,
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
          <h2>Campus placement dashboard</h2>
          <p>Review attendance by drive and follow each student’s progress across the drives you organise.</p>
          <div className="workspace-summary">
            <div>
              <strong>{owned.drives.length}</strong>
              <span>Drives</span>
            </div>
            <div>
              <strong>{studentsById.size}</strong>
              <span>Unique students</span>
            </div>
            <div>
              <strong>{placedStudents}</strong>
              <span>Students placed</span>
            </div>
            <div>
              <strong>{placementRate(placedStudents, studentsById.size)}</strong>
              <span>Overall placement rate</span>
            </div>
          </div>
          {owned.drives.length === 0 && <p>Publish a drive to start tracking placements.</p>}
          {owned.drives.length > 0 && (
            <div className="workspace-table-wrap">
              <table>
                <caption className="text-left font-semibold py-2">Drive outcomes</caption>
                <thead><tr><th scope="col">Drive</th><th scope="col">Registered</th><th scope="col">Attended</th>
                  <th scope="col">Absent</th><th scope="col">Unmarked</th><th scope="col">Placed</th><th scope="col">Placement rate</th></tr></thead>
                <tbody>{owned.drives.map(drive => {
                  const { registered = 0, attended = 0, absent = 0, placed = 0 } = driveCounts.get(drive.id) ?? {};
                  return <tr key={drive.id}><th scope="row">{drive.title}<small>{drive.college}</small></th>
                    <td>{registered}</td><td>{attended}</td><td>{absent}</td><td>{registered - attended - absent}</td>
                    <td>{placed}</td><td>{placementRate(placed, registered)}</td></tr>;
                })}</tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-sm">Each drive’s rate is placements divided by registrations. The overall rate counts each student once.</p>
          {!owned.canTrack && owned.drives.length > 0 && <p>Renew Campus to update attendance for your drives.</p>}
          <div className="workspace-form">
            <div className="workspace-grid">
              <label>Filter by drive
                <select value={selectedDrive} onChange={event => setSelectedDrive(event.target.value)}>
                  <option value="">All drives</option>
                  {owned.drives.map(drive => <option key={drive.id} value={drive.id}>{drive.title}</option>)}
                </select>
              </label>
              <label>Find a student
                <input type="search" value={studentSearch} onChange={event => setStudentSearch(event.target.value)} placeholder="Name or email" />
              </label>
            </div>
            <button disabled={!visibleRegistrations.length} onClick={download}>Export matching registrations as CSV</button>
          </div>
          <div className="workspace-table-wrap">
            <table>
              <caption className="text-left font-semibold py-2">Student progress</caption>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Drive</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Placement status</th>
                </tr>
              </thead>
              <tbody>
                {!visibleStudents.length && <tr><td colSpan={4}>No matching students.</td></tr>}
                {visibleStudents.map(studentId => {
                  const progress = studentsById.get(studentId)!.filter(item => !selectedDrive || String(item.drive_id) === selectedDrive);
                  const { name, email } = progress[0];
                  return progress.map((student, index) => (
                    <tr key={`${student.drive_id}-${studentId}`}>
                      {index === 0 && <th scope="row" rowSpan={progress.length}>{name}<small>{email}</small></th>}
                      <td>{student.title}<small>{student.college}</small></td>
                      <td><select aria-label={`Attendance for ${name} in ${student.title}`} value={student.attendance}
                        disabled={busy || !owned.canTrack}
                        onChange={event => void updateRegistration(student, { attendance: event.target.value as Attendance })}>
                        {attendanceOptions.map(item => <option key={item}>{item}</option>)}
                      </select></td>
                      <td><select aria-label={`Placement status for ${name} in ${student.title}`} value={student.status}
                        disabled={busy} onChange={event => void updateRegistration(student, { status: event.target.value })}>
                        {placementStages.map(item => <option key={item}>{item}</option>)}
                      </select></td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
