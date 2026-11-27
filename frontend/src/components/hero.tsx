import { ArrowRight, BriefcaseBusiness, Check, Compass, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

function TalentIllustration() {
  return (
    <div className="hero-art" aria-label="Mikasa, the HireHeaven career guide">
      <div className="hero-art-panel">
        <div className="guide-orbit guide-orbit-one" aria-hidden="true" />
        <div className="guide-orbit guide-orbit-two" aria-hidden="true" />
        <Image
          className="talent-character"
          src="/mikasa-guide.png"
          alt="Mikasa, the animated HireHeaven career guide"
          width={1536}
          height={1024}
          priority
        />

        <div className="hero-art-note" aria-hidden="true">
          <span>Meet Mikasa</span>
          <strong>Your Career Guide</strong>
          <i />
        </div>

        <div className="floating-card floating-card-match">
          <div className="floating-icon"><Check size={18} /></div>
          <div><strong>Great match</strong><span>Your next role is out there</span></div>
        </div>
        <div className="floating-card floating-card-role">
          <div className="floating-icon"><BriefcaseBusiness size={18} /></div>
          <div><strong>Fresh opportunities</strong><span>Made for your next chapter</span></div>
        </div>
        <span className="guide-spark guide-spark-one" aria-hidden="true">✦</span>
        <span className="guide-spark guide-spark-two" aria-hidden="true">✦</span>
      </div>
    </div>
  );
}

const Hero = () => (
  <section className="hero-shell">
    <div className="hero-grid">
      <div className="hero-copy">
        <div className="hero-kicker">
          <span className="hero-kicker-mark"><Sparkles size={13} /></span>
          Find work that moves you forward
        </div>
        <h1 className="hero-title">
          <span className="hero-title-line"><span>Good work</span> <span>finds</span></span>
          <span className="hero-title-accent"><span>its people.</span></span>
        </h1>
        <p className="hero-description">
          Explore roles that fit your ambition, meet teams building what’s next,
          and make your next career move with confidence.
        </p>

        <div className="hero-actions">
          <Link href="/jobs">
            <Button size="lg" className="gap-2">
              <Search size={18} /> Explore jobs
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg" className="gap-2">
              <Compass size={18} /> Meet HireHeaven
            </Button>
          </Link>
        </div>

        <div className="hero-proof" aria-label="Platform highlights">
          <span className="hero-proof-item"><Check size={15} /> Free to explore</span>
          <span className="hero-proof-item"><Check size={15} /> Built for people and teams</span>
          <span className="hero-proof-item"><Check size={15} /> AI career tools</span>
        </div>
      </div>

      <TalentIllustration />
    </div>
  </section>
);

export default Hero;
