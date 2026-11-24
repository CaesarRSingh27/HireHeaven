import { ArrowRight, BriefcaseBusiness, Compass, HeartHandshake, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: HeartHandshake,
    title: "People Come First",
    description: "A thoughtful experience for candidates and the teams looking to meet them.",
    tone: "about-value-lilac",
  },
  {
    icon: Target,
    title: "Find The Right Fit",
    description: "Clear role details and useful career tools help every next step feel more confident.",
    tone: "about-value-peach",
  },
  {
    icon: Compass,
    title: "Keep Moving Forward",
    description: "Explore new opportunities, build your profile, and make progress at your pace.",
    tone: "about-value-mint",
  },
];

const About = () => (
  <main className="about-page">
    <section className="about-hero">
      <div className="about-hero-copy">
        <span className="about-eyebrow"><Sparkles size={15} /> A Better Way To Connect</span>
        <h1>Good Work Starts With A Great Connection.</h1>
        <p>
          HireHeaven brings people and teams together with a clearer, friendlier way to find
          meaningful work and discover the talent behind it.
        </p>
        <div className="about-hero-actions">
          <Link href="/jobs">
            <Button size="lg" className="gap-2">Explore Opportunities <ArrowRight size={18} /></Button>
          </Link>
          <span className="about-hand-note">Your next chapter starts here</span>
        </div>
      </div>

      <div className="about-visual-wrap">
        <div className="about-photo-frame">
          <Image
            src="/about.jpg"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 48vw"
            className="about-photo"
            alt="A bright workspace ready for the next big idea"
          />
          <div className="about-photo-label">
            <span className="about-photo-icon"><BriefcaseBusiness size={18} /></span>
            <span><strong>Make Room For What’s Next</strong><small>People, purpose, possibility.</small></span>
          </div>
        </div>
        <div className="about-stamp" aria-hidden="true">Made For<br />Your Next Move</div>
      </div>
    </section>

    <section className="about-story" aria-labelledby="about-story-title">
      <div className="about-story-heading">
        <span className="about-eyebrow"><span className="about-eyebrow-dot" /> Our Mission</span>
        <h2 id="about-story-title">A little less searching.<br /><span>A lot more possibility.</span></h2>
      </div>
      <div className="about-story-copy">
        <p>
          Looking for a job or the right person shouldn’t feel like sorting through endless noise.
          We’re building a welcoming place where candidates can show what they do best and
          employers can find people who are ready to make a difference.
        </p>
        <p>
          From discovering roles to presenting your experience, HireHeaven helps make each step
          feel more human, more useful, and easier to act on.
        </p>
      </div>
    </section>

    <section className="about-values" aria-labelledby="about-values-title">
      <div className="about-section-heading">
        <span className="about-eyebrow">What We Believe</span>
        <h2 id="about-values-title">Built Around Better Connections</h2>
        <p>Small details make the journey feel more human. These ideas guide every part of HireHeaven.</p>
      </div>
      <div className="about-values-grid">
        {values.map(({ icon: Icon, title, description, tone }, index) => (
          <article className={`about-value-card ${tone}`} key={title}>
            <div className="about-value-topline"><span>0{index + 1}</span><Icon size={21} /></div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="about-cta">
      <div className="about-cta-orbit" aria-hidden="true" />
      <div className="about-cta-copy">
        <span className="about-eyebrow"><Sparkles size={15} /> Your Next Chapter</span>
        <h2>Ready To See What’s Out There?</h2>
        <p>Start exploring roles and find an opportunity that feels right for you.</p>
      </div>
      <Link href="/jobs" className="about-cta-link">
        <Button variant="outline" size="lg" className="gap-2">Find A Job <ArrowRight size={18} /></Button>
      </Link>
    </section>
  </main>
);

export default About;
