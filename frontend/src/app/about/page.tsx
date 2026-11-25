import { ArrowRight, BriefcaseBusiness, Compass, FileCheck2, HeartHandshake, Search, Sparkles, Target, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: HeartHandshake,
    title: "People, before profiles",
    description: "Every search starts with a person, a goal, and a story worth noticing.",
    tone: "about-value-lilac",
  },
  {
    icon: Target,
    title: "The right fit matters",
    description: "Find roles and teams that align with your strengths and the way you want to grow.",
    tone: "about-value-peach",
  },
  {
    icon: Compass,
    title: "Progress, your way",
    description: "Take a useful next step with tools that make room for your own pace and ambition.",
    tone: "about-value-mint",
  },
];

const journey = [
  { icon: Search, title: "Find your kind of work.", text: "Explore openings by role and discover teams where your strengths can shine.", character: "/violettee-anime.webp", alt: "Violettee pointing toward new job opportunities", action: "Explore roles", href: "/jobs" },
  { icon: FileCheck2, title: "Tell your story well.", text: "Build a profile and resume that make your experience easy to see.", character: "/chinatsu-anime.webp", alt: "Chinatsu presenting a career portfolio", action: "Create a profile", href: "/register" },
  { icon: UsersRound, title: "Make a real connection.", text: "Bring people and teams closer, then plan the next step with confidence.", character: "/genshin-anime.webp", alt: "Genshin welcoming visitors toward their next career step", action: "Get career guidance", href: "/#career-guidance" },
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
          <Image
            src="/trissy-anime.webp"
            width={250}
            height={375}
            className="about-character-guide"
            alt="Trissy presenting the next career step"
          />
          <span className="about-character-note">Your story, beautifully told</span>
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
        <h2 id="about-story-title">Less noise.<br /><span>More possibility.</span></h2>
        <div className="about-story-aside">
          <p>Better tools. More human connections. Room to grow.</p>
          <Image src="/genshin-anime.webp" width={200} height={225} alt="Genshin welcoming visitors toward new possibilities" />
        </div>
      </div>
      <div className="about-story-copy">
        <p className="about-story-lead">
          Finding your next role—or the right person—should feel full of possibility, not buried in tabs and guesswork.
        </p>
        <p>
          HireHeaven brings opportunities, useful career tools, and people together in one considered space—so you can show your strengths, find a better fit, and move forward on your terms.
        </p>
      </div>
    </section>

    <section className="about-journey" aria-labelledby="about-journey-title">
      <div className="about-section-heading">
          <span className="about-eyebrow"><Compass size={15} /> The HireHeaven Experience</span>
          <h2 id="about-journey-title">Three thoughtful steps to <em>what’s next.</em></h2>
          <p>From first search to a confident next move, we make the journey feel clear and human.</p>
      </div>
      <div className="about-journey-grid">
          {journey.map(({ icon: Icon, title, text, character, alt, action, href }, index) => (
          <article className="about-journey-card" key={title}>
            <div className="about-journey-top"><Icon size={21} /></div>
              <div className="about-journey-copy"><span className="about-journey-kicker">{["DISCOVER", "SHOW YOUR VALUE", "MOVE FORWARD"][index]}</span><h3>{title}</h3><p>{text}</p></div>
              <Image className="about-journey-character" src={character} width={210} height={315} alt={alt} />
              <Link className="about-journey-action" href={href}>{action}<ArrowRight size={15} /></Link>
          </article>
        ))}
      </div>
    </section>

    <section className="about-values" aria-labelledby="about-values-title">
      <div className="about-section-heading">
        <span className="about-eyebrow"><HeartHandshake size={15} /> What We Believe</span>
        <h2 id="about-values-title">Built for people.<br /><em>Built for possibility.</em></h2>
        <p>Good work begins with people. These are the principles behind every connection we make.</p>
      </div>
      <div className="about-values-grid">
        {values.map(({ icon: Icon, title, description, tone }) => (
          <article className={`about-value-card ${tone}`} key={title}>
            <div className="about-value-topline"><Icon size={21} /></div>
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
        <h2>Ready for a better next step?</h2>
        <p>Find a role that fits, show what you can do, and start a chapter that feels like yours.</p>
      </div>
      <div className="about-cta-character"><Image src="/trissy-anime.webp" width={230} height={345} alt="Trissy presenting the next career opportunity" /></div>
      <Link href="/jobs" className="about-cta-link">
        <Button variant="outline" size="lg" className="gap-2">Find A Job <ArrowRight size={18} /></Button>
      </Link>
    </section>
  </main>
);

export default About;
