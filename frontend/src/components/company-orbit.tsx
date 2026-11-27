const companies = [
  { name: "ITC", mark: "ITC", tone: "itc" },
  { name: "NVIDIA", mark: "N", tone: "nvidia" },
  { name: "Razorpay", mark: "R", tone: "razorpay" },
  { name: "Infosys", mark: "Infosys", tone: "infosys" },
  { name: "Tata", mark: "T", tone: "tata" },
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
      <div className="company-orbit" aria-hidden="true">
        <div className="company-orbit-arch" />
        <div className="company-orbit-track">
          {companies.map(({ name, mark, tone }, index) => (
            <div
              className={`company-orbit-stop company-orbit-stop-${index + 1}`}
              key={name}
            >
              <span className={`company-orbit-logo ${tone}`}>{mark}</span>
              <span className="company-orbit-name">{name}</span>
            </div>
          ))}
        </div>
        <div className="company-orbit-core"><span>HH</span><small>OPPORTUNITY</small></div>
      </div>
    </section>
  );
}
