"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { workspaceApi, errorMessage, type Portfolio } from "@/lib/workspace";

export default function TalentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<
    (Portfolio & { name: string; bio: string; skills: string[] }) | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    workspaceApi(`/portfolio/${encodeURIComponent(slug)}`)
      .then((result) => setProfile(result.data))
      .catch((error) => setError(errorMessage(error)));
  }, [slug]);
  if (error)
    return (
      <main className="workspace-page">
        <section className="workspace-card">
          <h1>Portfolio unavailable.</h1>
          <p>{error}</p>
          <Link href="/jobs">Explore jobs →</Link>
        </section>
      </main>
    );
  if (!profile)
    return (
      <main className="workspace-page">
        <p role="status">Opening portfolio…</p>
      </main>
    );
  return (
    <main
      className={`workspace-page talent-page ${profile.theme === "editorial" ? "talent-editorial" : ""}`}
    >
      <header className="workspace-heading">
        <span className="workspace-kicker">A HireHeaven portfolio</span>
        <h1>{profile.name}</h1>
        <p className="talent-headline">{profile.headline}</p>
        {profile.github && (
          <a href={profile.github} target="_blank" rel="noreferrer">
            Explore my GitHub ↗
          </a>
        )}
      </header>
      <section className="workspace-card">
        <h2>A little about me.</h2>
        <p className="whitespace-pre-wrap">
          {profile.bio || "More of my story is coming soon."}
        </p>
        <div className="workspace-tags">
          {profile.skills.map((skill) => (
            <span className="workspace-chip" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </section>
      <section className="workspace-card">
        <h2>Selected work.</h2>
        <div className="workspace-grid">
          {profile.projects.map((project, index) => (
            <article className="workspace-project" key={index}>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer">
                  View project ↗
                </a>
              )}
            </article>
          ))}
        </div>
        {!profile.projects.length && (
          <p>Projects will appear here as this portfolio grows.</p>
        )}
      </section>
    </main>
  );
}
