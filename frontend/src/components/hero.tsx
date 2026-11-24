import { ArrowRight, BriefcaseBusiness, Check, Compass, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

function TalentIllustration() {
  return (
    <div className="hero-art" aria-label="A friendly animated HireHeaven guide">
      <div className="hero-art-panel">
        <svg
          className="talent-character"
          viewBox="0 0 560 500"
          role="img"
          aria-label="An illustrated person ready for their next career opportunity"
        >
          <defs>
            <linearGradient id="jacket" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#8174ff" />
              <stop offset="1" stopColor="#5144d6" />
            </linearGradient>
            <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f1edff" />
            </linearGradient>
          </defs>

          <ellipse className="character-shadow" cx="282" cy="446" rx="130" ry="20" fill="#6055cf" opacity=".18" />

          {/* floating search sparkles */}
          <g fill="#ffb56f">
            <path d="M98 132l7 19 19 7-19 7-7 19-7-19-19-7 19-7z" />
            <path d="M447 226l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" opacity=".7" />
          </g>
          <circle cx="444" cy="132" r="7" fill="#9ce3cc" />
          <circle cx="112" cy="264" r="5" fill="#9b8dff" />

          {/* shoulders and jacket */}
          <path d="M148 420c8-84 38-135 100-151h75c63 16 94 67 102 151v25H148z" fill="url(#jacket)" />
          <path d="M236 270l46 56 46-56 22 15-34 135h-68l-34-135z" fill="#f8f6ff" />
          <path d="M236 270l46 56-31 21-35-62zM328 270l-46 56 31 21 35-62z" fill="#ded9ff" />
          <path d="M276 343l6-2 8 13-8 60-10-60 8-13z" fill="#ff9c77" />
          <path d="M280 412v34" stroke="#4038a8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="280" cy="378" r="4" fill="#fff" opacity=".9" />
          <circle cx="280" cy="401" r="4" fill="#fff" opacity=".9" />

          {/* neck */}
          <path d="M254 231h53v49c0 17-12 30-27 30s-26-13-26-30z" fill="#d99170" />

          {/* hair behind the face */}
          <path d="M211 180c0-51 28-80 71-80 46 0 73 31 73 82v20c0 9-5 16-12 19v-43c0-34-23-59-61-59s-59 25-59 59v43c-7-3-12-10-12-19z" fill="#302851" />

          {/* ears and face */}
          <ellipse cx="218" cy="203" rx="13" ry="19" fill="#e4a17d" />
          <ellipse cx="348" cy="203" rx="13" ry="19" fill="#e4a17d" />
          <path d="M224 173c0-34 22-56 58-56 38 0 60 23 60 58v44c0 40-26 66-60 66-34 0-58-26-58-66z" fill="#f0b28d" />
          <path d="M221 177c-7-43 13-74 48-82 34-8 66 8 78 38-16-15-32-22-50-23-21 20-45 29-73 27z" fill="#302851" />

          {/* expressive features */}
          <path d="M246 202c7-6 15-6 22 0M300 202c7-6 15-6 22 0" fill="none" stroke="#493652" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="258" cy="215" rx="3.5" ry="4.5" fill="#302851" />
          <ellipse cx="311" cy="215" rx="3.5" ry="4.5" fill="#302851" />
          <path d="M270 242c8 7 18 7 26 0" fill="none" stroke="#a95550" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="241" cy="232" rx="10" ry="5" fill="#ef8d7c" opacity=".38" />
          <ellipse cx="328" cy="232" rx="10" ry="5" fill="#ef8d7c" opacity=".38" />
          <path d="M265 251c5-4 10-4 15-1 5-3 11-3 16 1-2 5-7 7-15 5-8 2-14 0-16-5z" fill="#795044" />
          <path d="M263 263c7 4 16 5 25 1" fill="none" stroke="#795044" strokeWidth="3" strokeLinecap="round" opacity=".72" />

          {/* one arm holding a bright opportunity card */}
          <path d="M378 312c22-5 40 1 52 19l36 54-29 19-48-43-32-17z" fill="#6659e5" />
          <path d="M443 375c12-10 27-8 35 4 7 11 4 25-7 32l-15 8-28-28z" fill="#f0b28d" />
          <g transform="rotate(-8 438 294)">
            <rect x="385" y="252" width="102" height="125" rx="15" fill="url(#paper)" stroke="#dcd7ff" strokeWidth="3" />
            <rect x="403" y="271" width="39" height="8" rx="4" fill="#8174ff" />
            <rect x="403" y="291" width="66" height="6" rx="3" fill="#d5d0eb" />
            <rect x="403" y="306" width="55" height="6" rx="3" fill="#d5d0eb" />
            <circle cx="418" cy="338" r="13" fill="#b8f0dd" />
            <path d="m412 338 4 4 8-9" fill="none" stroke="#287c69" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="440" y="333" width="28" height="6" rx="3" fill="#d5d0eb" />
            <rect x="440" y="346" width="20" height="5" rx="2.5" fill="#e3dff1" />
          </g>

          {/* briefcase at the character's side */}
          <g transform="rotate(5 166 367)">
            <rect x="105" y="332" width="82" height="70" rx="13" fill="#ffb56f" />
            <path d="M130 333v-10c0-7 5-12 12-12h12c7 0 12 5 12 12v10" fill="none" stroke="#b5663b" strokeWidth="7" />
            <path d="M105 359h82" stroke="#d98850" strokeWidth="5" />
            <rect x="137" y="354" width="18" height="12" rx="4" fill="#fff2db" />
          </g>
        </svg>

        <div className="hero-art-note" aria-hidden="true">
          <span>Fast. Simple.</span>
          <strong>People First.</strong>
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
      </div>
    </div>
  );
}

const Hero = () => {
  return (
    <section className="hero-shell">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="hero-kicker-mark"><Sparkles size={13} /></span>
            Find work that moves you forward
          </div>
          <h1 className="hero-title">
            Good work finds
            <span className="hero-title-accent">its people.</span>
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
};

export default Hero;
