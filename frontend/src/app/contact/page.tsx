"use client";

import { FormEvent, useState } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";

const emailAddress = "info@coffeeshopcaesar.com";

export default function ContactPage() {
  const [notice, setNotice] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();
    const subject = encodeURIComponent(`HireHeaven message from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    setNotice("Your email app is opening with your message ready to send.");
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="contact-page">
      <section className="contact-heading">
        <span className="about-eyebrow"><Sparkles size={15} /> We’re Here To Help</span>
        <h1>Let’s Start A Conversation.</h1>
        <p>Questions about your next move, your team, or HireHeaven? Send us a note and we’ll be glad to hear from you.</p>
        <span className="contact-heading-rule" aria-hidden="true" />
      </section>

      <section className="contact-layout" aria-label="Contact information and message form">
        <aside className="contact-details-card">
          <div className="contact-card-heading">
            <span className="contact-icon contact-icon-peach"><MessageCircle size={20} /></span>
            <div><span className="contact-kicker">Get In Touch</span><h2>We’d Love To Hear From You</h2></div>
          </div>
          <p className="contact-intro">Reach out whenever you need a hand. We’ll help point you in the right direction.</p>

          <a className="contact-detail-row" href="https://maps.google.com/?q=12%2F6A+Dashashwamedh+Ghat%2C+Varanasi%2C+India+221002" target="_blank" rel="noreferrer">
            <span className="contact-icon"><MapPin size={19} /></span>
            <span><small>Visit Us</small><strong>12/6A Dashashwamedh Ghat,<br />Varanasi, India 221002</strong></span>
          </a>
          <a className="contact-detail-row" href={`mailto:${emailAddress}`}>
            <span className="contact-icon"><Mail size={19} /></span>
            <span><small>Email Us</small><strong>{emailAddress}</strong></span>
          </a>
          <a className="contact-detail-row" href="tel:+919651170946">
            <span className="contact-icon"><Phone size={19} /></span>
            <span><small>Call Us</small><strong>+91 9651170946</strong></span>
          </a>

          <div className="contact-hours">
            <span className="contact-icon"><Clock3 size={19} /></span>
            <div><small>Hours Of Operation</small>
              <p><strong>Tuesday – Saturday</strong><span>6:00 AM – 8:00 PM</span></p>
              <p><strong>Sunday</strong><span>7:00 AM – 10:00 PM</span></p>
              <p><strong>Monday</strong><span>Closed</span></p>
            </div>
          </div>
          <div className="contact-note"><Sparkles size={16} /> A good conversation can open a new door.</div>
        </aside>

        <form className="contact-form-card" onSubmit={handleSubmit}>
          <span className="contact-kicker">Send A Message</span>
          <h2>How Can We Help?</h2>
          <p>Share a little about what you’re looking for and we’ll get back to you.</p>
          <label htmlFor="contact-name">Your Name</label>
          <input id="contact-name" name="name" type="text" placeholder="e.g. Alex Morgan" autoComplete="name" required />
          <label htmlFor="contact-email">Your Email</label>
          <input id="contact-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
          <label htmlFor="contact-message">Your Message</label>
          <textarea id="contact-message" name="message" placeholder="Tell us how we can help…" rows={5} required />
          <button className="contact-submit" type="submit">Send Message <Send size={17} /></button>
          {notice && <p className="contact-notice" role="status">{notice}</p>}
          <small className="contact-form-footnote">This opens your email app with the message addressed to {emailAddress}.</small>
        </form>
      </section>
    </main>
  );
}
