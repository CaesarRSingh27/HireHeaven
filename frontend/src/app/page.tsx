"use client";
import CarrerGuide from "@/components/carrer-guide";
import Hero from "@/components/hero";
import Loading from "@/components/loading";
import ResumeAnalyzer from "@/components/resume-analyser";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppContext";
import { ArrowRight, Compass, FileCheck2, Search, Sparkles, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const journeySteps = [
  { number: "01", icon: Search, title: "Explore With Intention", text: "Browse opportunities by role, location, and the kind of work you want to do next." },
  { number: "02", icon: FileCheck2, title: "Show Your Strengths", text: "Build a profile that tells your story and make your resume ready for its next reader." },
  { number: "03", icon: Compass, title: "Choose Your Next Step", text: "Use thoughtful career guidance to turn your skills into a direction you can act on." },
];

const characters = [
  { name: "Genshin", image: "/genshin-anime.webp", alt: "Genshin, an anime character presenting the next step", note: "Curiosity for every new direction.", tone: "character-violet" },
  { name: "Chinatsu", image: "/chinatsu-anime.webp", alt: "Chinatsu, an anime character welcoming visitors", note: "A warm welcome at every step.", tone: "character-peach" },
  { name: "Violettee", image: "/violettee-anime.webp", alt: "Violettee, an anime character pointing toward new opportunities", note: "Confidence for bold career moves.", tone: "character-amber" },
  { name: "Trissy", image: "/trissy-anime.webp", alt: "Trissy, an anime character presenting a career folder", note: "A polished touch for your story.", tone: "character-rose" },
];

const Home = () => {
  const { loading } = useAppData();
  if (loading) return <Loading />;
  return (
    <div>
      <Hero />
      <section className="home-journey" aria-labelledby="home-journey-title">
        <div className="home-section-heading">
          <span className="about-eyebrow"><Sparkles size={15} /> A More Thoughtful Job Search</span>
          <h2 id="home-journey-title">A Clearer Way To Find Your <em>Next.</em></h2>
          <p>From first search to next step, HireHeaven brings the tools and opportunities together in one welcoming place.</p>
        </div>
        <div className="home-journey-grid">
          {journeySteps.map(({ number, icon: Icon, title, text }) => (
            <article className="home-journey-card" key={number}>
              <div className="home-journey-top"><span>{number}</span><Icon size={21} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <CarrerGuide />
      <ResumeAnalyzer />
      <section className="character-showcase" aria-labelledby="character-showcase-title">
        <div className="character-showcase-heading">
          <span className="about-eyebrow"><Sparkles size={15} /> A Cast Of Characters</span>
          <h2 id="character-showcase-title">A Little More <em>Character.</em></h2>
          <p>Meet a few of the faces bringing their own style and spirit to the HireHeaven journey.</p>
        </div>
        <div className="character-showcase-grid">
          {characters.map(({ name, image, alt, note, tone }, index) => (
            <article className={`character-showcase-card ${tone}`} key={name}>
              <div className="character-showcase-art">
                <Image src={image} alt={alt} fill sizes="(max-width: 680px) 90vw, (max-width: 1000px) 42vw, 22vw" />
                <span className="character-showcase-index">0{index + 1}</span>
                <span className="character-showcase-star" aria-hidden="true">✦</span>
              </div>
              <div className="character-showcase-copy"><h3>{name}</h3><p>{note}</p></div>
            </article>
          ))}
        </div>
      </section>
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
