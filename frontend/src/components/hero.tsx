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
              <stop offset="0" stopColor="#7663e9" />
              <stop offset="1" stopColor="#42349f" />
            </linearGradient>
            <linearGradient id="jacketShadow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#392e83" />
              <stop offset="1" stopColor="#282354" />
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

          {/* tailored jacket and open-collar shirt */}
          <path d="M148 420c8-84 38-135 100-151h75c63 16 94 67 102 151v25H148z" fill="url(#jacket)" />
          <path d="M236 270l46 56 46-56 22 15-34 135h-68l-34-135z" fill="#fffdf8" />
          <path d="M236 270l46 56-31 21-35-62zM328 270l-46 56 31 21 35-62z" fill="url(#jacketShadow)" />
          <path d="m269 329 13 12 13-12-7 28 8 74h-28l8-74z" fill="#e5dcff" />
          <path d="M280 412v34" stroke="#302967" strokeWidth="4" strokeLinecap="round" />
          <circle cx="280" cy="378" r="4" fill="#fff" opacity=".9" />
          <circle cx="280" cy="401" r="4" fill="#fff" opacity=".9" />

          {/* neck */}
          <path d="M254 231h53v49c0 17-12 30-27 30s-26-13-26-30z" fill="#d99170" />

          {/* neat swept-back quiff */}
          <path d="M221 190c-9-36-1-73 22-91 13-25 43-35 67-26 23-4 44 9 53 29 16 20 17 50 5 74l-12 23-7-50c-9-31-31-47-61-47-34 0-55 20-61 52l-3 36z" fill="#292238" />
          <path d="M240 111c13-22 34-32 56-29 12-5 26-4 37 2-21-2-39 5-53 15-12 8-24 12-40 12z" fill="#51405a" opacity=".7" />

          {/* ears and face */}
          <ellipse cx="218" cy="203" rx="13" ry="19" fill="#c98565" />
          <ellipse cx="348" cy="203" rx="13" ry="19" fill="#c98565" />
          <path d="M224 173c0-34 22-56 58-56 38 0 60 23 60 58v44c0 40-26 66-60 66-34 0-58-26-58-66z" fill="#d99773" />
          <path d="M240 109c14-18 35-27 57-25" fill="none" stroke="#51405a" strokeWidth="7" strokeLinecap="round" opacity=".7" />

          {/* expressive features */}
          <path d="M246 199c7-5 15-5 22 0M300 199c7-5 15-5 22 0" fill="none" stroke="#46313a" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="258" cy="214" rx="3.5" ry="4.5" fill="#292238" />
          <ellipse cx="311" cy="214" rx="3.5" ry="4.5" fill="#292238" />
          <path d="M283 216c-2 10-5 17-7 24 4 3 8 4 13 2" fill="none" stroke="#b9755b" strokeWidth="3" strokeLinecap="round" />
          <path d="M269 244c7 6 18 7 27 0" fill="none" stroke="#984f50" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="241" cy="233" rx="9" ry="4" fill="#ef8d7c" opacity=".25" />
          <ellipse cx="328" cy="233" rx="9" ry="4" fill="#ef8d7c" opacity=".25" />
          <path d="M255 255c6 10 16 15 27 15s21-5 27-15c-7 3-14 4-27 4s-20-1-27-4z" fill="#64443f" />
          <path d="M263 258c6 5 14 7 19 7s13-2 19-7" fill="none" stroke="#d99773" strokeWidth="3" strokeLinecap="round" />
          <path d="M263 274c11 5 23 5 34 0" fill="none" stroke="#bd7e61" strokeWidth="2" strokeLinecap="round" opacity=".65" />

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
