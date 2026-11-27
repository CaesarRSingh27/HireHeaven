"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/context/AppContext";
import { errorMessage, workspaceApi } from "@/lib/workspace";

interface Match {
  matched: string[];
  missing: string[];
  score: number | null;
  analysis: string;
  allowance: { used: number; limit: number };
}
export default function JobMatch({ jobId }: { jobId: number }) {
  const { user } = useAppData();
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<Match | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user || user.role !== "jobseeker") return null;
  async function compare() {
    setBusy(true);
    setError("");
    try {
      setResult(
        (await workspaceApi(`/match/${jobId}`, "POST", { resume_text: resume }))
          .data,
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card my-6">
      <span className="workspace-kicker">Find your fit</span>
      <h2>How does this role line up?</h2>
      <p>
        Compare the listing with your profile skills and optional resume text.
        Free accounts include five comparisons per calendar month.
      </p>
      <label>
        Resume text, optional
        <textarea
          rows={4}
          maxLength={10000}
          value={resume}
          onChange={(event) => setResume(event.target.value)}
          placeholder="Paste relevant experience for a more detailed comparison"
        />
      </label>
      <button disabled={busy} onClick={() => void compare()}>
        {busy ? "Comparing…" : "Compare my experience"}
      </button>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="workspace-result">
          {result.score !== null && (
            <p>
              <strong>{result.score}%</strong> of the listing’s explicit skills
              found in your supplied profile and text
            </p>
          )}
          <p>
            Skills found · {result.matched.join(", ") || "No explicit matches"}
          </p>
          <p>
            Skills to review · {result.missing.join(", ") || "None specified"}
          </p>
          <p className="whitespace-pre-wrap">{result.analysis}</p>
          <small>
            {result.allowance.used} / {result.allowance.limit} comparisons used
            this month
          </small>
        </div>
      )}
      <div className="workspace-links">
        <Link href="/workspace#interview">Practise with Reze →</Link>
        <Link href="/subscribe">Explore Career Plus →</Link>
      </div>
    </section>
  );
}
