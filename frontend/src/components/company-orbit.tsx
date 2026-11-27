const companies = [
  { name: "ITC", src: "/company-logos/itc.svg", tone: "itc" },
  { name: "NVIDIA", src: "/company-logos/nvidia.svg", tone: "nvidia" },
  { name: "Razorpay", src: "/company-logos/razorpay.svg", tone: "razorpay" },
  { name: "Infosys", src: "/company-logos/infosys.svg", tone: "infosys" },
  { name: "Tata", src: "/company-logos/tata.svg", tone: "tata" },
  { name: "Adobe", src: "/company-logos/adobe.svg", tone: "adobe" },
  { name: "OpenAI", src: "/company-logos/openai.svg", tone: "openai" },
  { name: "Anthropic", src: "/company-logos/anthropic.svg", tone: "anthropic" },
  { name: "Google", src: "/company-logos/google.svg", tone: "google" },
  { name: "Microsoft", src: "/company-logos/microsoft.svg", tone: "microsoft" },
  { name: "Amazon", src: "/company-logos/amazon.svg", tone: "amazon" },
  { name: "Meta", src: "/company-logos/meta.svg", tone: "meta" },
];

export default function CompanyOrbit() {
  return (
    <section className="company-orbit-section" aria-label="Companies across the opportunity landscape">
      <div className="company-orbit-copy">
        <span className="about-eyebrow">A wider world of work</span>
        <h2>Possibility Has <em>Many Paths.</em></h2>
        <p>Explore opportunities across the names and industries shaping what comes next.</p>
      </div>
      <div className="company-orbit" role="group" aria-label="Company logos orbiting HireHeaven: ITC, NVIDIA, Razorpay, Infosys, Tata, Adobe, OpenAI, Anthropic, Google, Microsoft, Amazon and Meta">
        <div className="company-orbit-arch" />
        <div className="company-orbit-track-clip">
          <div className="company-orbit-track">
            {companies.map(({ name, src, tone }, index) => (
              <div
                className={`company-orbit-stop company-orbit-stop-${index + 1}`}
                key={name}
              >
                <span className="company-orbit-upright">
                  <span className={`company-orbit-logo ${tone}`}><img src={src} alt={name} /></span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="company-orbit-core"><img src="/hireheaven-mark.svg" alt="" /><small>HIREHEAVEN</small></div>
      </div>
    </section>
  );
}
