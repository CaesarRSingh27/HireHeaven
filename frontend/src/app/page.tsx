"use client";
import CarrerGuide from "@/components/carrer-guide";
import Hero from "@/components/hero";
import Loading from "@/components/loading";
import ResumeAnalyzer from "@/components/resume-analyser";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppContext";
import { ArrowRight, Compass, FileCheck2, Search, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import React from "react";

const journeySteps = [
  { label: "DISCOVER", icon: Search, title: "Find work that fits.", text: "Explore openings by role and location, and find opportunities that match your strengths and ambitions.", action: "Explore open roles", href: "/jobs" },
  { label: "MAKE YOUR MARK", icon: FileCheck2, title: "Let your experience speak.", text: "Build a standout profile and give your resume the polish it needs to make a memorable first impression.", action: "Create your profile", href: "/register" },
  { label: "MOVE FORWARD", icon: Compass, title: "Turn possibility into a plan.", text: "Connect your strengths to new directions with career guidance designed around what you can do next.", action: "Find your direction", href: "#career-guidance" },
];

const Home = () => {
  const { loading } = useAppData();
  if (loading) return <Loading />;
  return (
    <div>
      <Hero />
      <section className="home-journey" aria-labelledby="home-journey-title">
        <div className="home-section-heading">
          <span className="about-eyebrow"><Sparkles size={15} /> Your Next Chapter Starts Here</span>
          <h2 id="home-journey-title">Make your next move <em>matter.</em></h2>
          <p>From the first search to a confident next step, find the tools and support to move your career forward.</p>
        </div>
        <div className="home-journey-grid">
          {journeySteps.map(({ label, icon: Icon, title, text, action, href }) => (
            <article className="home-journey-card" key={label}>
              <div className="home-journey-top"><span className="home-journey-icon"><Icon size={20} /></span></div>
              <span className="home-journey-kicker">{label}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link className="home-journey-action" href={href}>{action}<ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>
      <CarrerGuide />
      <ResumeAnalyzer />
      <section className="home-audience" aria-labelledby="home-audience-title">
        <div className="home-audience-copy">
          <span className="about-eyebrow"><UsersRound size={15} /> Good Things Happen When People Connect</span>
          <h2 id="home-audience-title">Your Next Chapter Starts With A <em>Connection.</em></h2>
          <p>Whether you’re ready to find your next role or bring the right person onto your team, start with a simple next step.</p>
        </div>
        <div className="home-audience-actions">
          <Link href="/jobs"><Button size="lg" className="gap-2">Find A Job <ArrowRight size={18} /></Button></Link>
          <Link href="/register"><Button size="lg" variant="outline" className="gap-2">Meet Your Next Hire <ArrowRight size={18} /></Button></Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
