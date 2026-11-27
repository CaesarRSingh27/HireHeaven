const companies = [
  { name: "ITC", mark: "ITC", tone: "itc" },
  { name: "NVIDIA", src: "/company-logos/nvidia.svg", tone: "nvidia" },
  { name: "Razorpay", src: "/company-logos/razorpay.svg", tone: "razorpay" },
  { name: "Infosys", src: "/company-logos/infosys.svg", tone: "infosys" },
  { name: "Tata", src: "/company-logos/tata.svg", tone: "tata" },
  { name: "Adobe", mark: "A", tone: "adobe" },
];

export default function CompanyOrbit() {
  return (
    <section className="company-orbit-section" aria-label="Companies across the opportunity landscape">
      <div className="company-orbit-copy">
        <span className="about-eyebrow">A wider world of work</span>
        <h2>Possibility has <em>many paths.</em></h2>
        <p>Explore opportunities across the names and industries shaping what comes next.</p>
      </div>
      <div className="company-orbit" role="img" aria-label="ITC, NVIDIA, Razorpay, Infosys, Tata and Adobe company marks orbiting HireHeaven">
        <div className="company-orbit-arch" />
        <div className="company-orbit-track">
          {companies.map(({ name, mark, src, tone }, index) => (
            <div
              className={`company-orbit-stop company-orbit-stop-${index + 1}`}
              key={name}
              title={name}
            >
              <span className="company-orbit-upright">
                <span className={`company-orbit-logo ${tone}`}>
                  {src ? <img src={src} alt="" /> : mark}
                </span>
                <span className="company-orbit-name">{name}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="company-orbit-core"><span>HH</span><small>OPPORTUNITY</small></div>
      </div>
    </section>
  );
}
