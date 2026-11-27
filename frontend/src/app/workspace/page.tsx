"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/context/AppContext";
import { errorMessage, workspaceApi, type Overview } from "@/lib/workspace";
import CandidateWorkspace from "@/components/candidate-workspace";
import HiringWorkspace from "@/components/hiring-workspace";
import CampusWorkspace from "@/components/campus-workspace";

export default function WorkspacePage() {
  const { user, loading } = useAppData();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("workspace");
  async function load() {
    try {
      setData((await workspaceApi("/overview")).data);
      setError("");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  useEffect(() => {
    if (user) void load();
  }, [user?.user_id]);
  return (
    <main className="workspace-page">
      <header className="workspace-heading">
        <span className="workspace-kicker">Your next chapter</span>
        <h1>
          Make room for <em>what’s next.</em>
        </h1>
        <p>
          {user?.role === "recruiter"
            ? "Bring the right people closer, one thoughtful step at a time."
            : "Keep your opportunities, preparation, and story in one place."}
        </p>
        <div className="workspace-links">
          <Link href="/jobs">Explore jobs →</Link>
          <Link href="/account">Manage profile →</Link>
          <Link href="/subscribe">Plans →</Link>
        </div>
      </header>
      {loading ? (
        <p role="status">Loading your account…</p>
      ) : !user ? (
        <section className="workspace-card">
          <h2>Your workspace is waiting.</h2>
          <p>Sign in to save roles, practise interviews, or manage hiring.</p>
          <Link href="/login">Sign in →</Link>
        </section>
      ) : (
        <>
          <div
            className="workspace-tabs"
            role="tablist"
            aria-label="Workspace sections"
          >
            <button
              role="tab"
              aria-selected={tab === "workspace"}
              onClick={() => setTab("workspace")}
            >
              {user.role === "recruiter" ? "Hiring & analytics" : "My career"}
            </button>
            <button
              role="tab"
              aria-selected={tab === "campus"}
              onClick={() => setTab("campus")}
            >
              Campus placements
            </button>
            <button onClick={() => void load()}>Refresh</button>
          </div>
          {error && (
            <section className="workspace-card">
              <p role="alert">{error}</p>
              <button onClick={() => void load()}>Retry</button>
            </section>
          )}
          {data && (
            <>
              {data.entitlements.length > 0 && (
                <p className="workspace-plan-status">
                  {data.entitlements
                    .map(
                      (plan) =>
                        `${plan.plan === "career" ? "Career Plus" : plan.plan === "college" ? "Campus" : "Recruiter Pro"} active until ${new Date(plan.expires_at).toLocaleDateString()}`,
                    )
                    .join(" · ")}
                </p>
              )}
              {tab === "campus" ? (
                <CampusWorkspace overview={data} reload={load} />
              ) : user.role === "recruiter" ? (
                <HiringWorkspace />
              ) : (
                <CandidateWorkspace data={data} reload={load} />
              )}
            </>
          )}
          {!data && !error && <p role="status">Opening your workspace…</p>}
        </>
      )}
    </main>
  );
}
