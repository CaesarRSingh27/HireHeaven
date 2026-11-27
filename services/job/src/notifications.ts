import { sql } from "./utils/db.js";
import { publishToTopic } from "./producer.js";

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);
const send = (to: string, subject: string, heading: string, content: string) =>
  publishToTopic("send-mail", {
    to, subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#171827"><h2>${escape(heading)}</h2><p style="line-height:1.7">${content}</p><p><a href="${escape(process.env.PUBLIC_URL || "http://localhost")}/workspace">Open your HireHeaven workspace</a></p></div>`,
  });

let timer: ReturnType<typeof setInterval> | undefined;
let running = false;

export async function processNotifications() {
  if (running) return;
  running = true;
  try {
    const alerts = await sql`SELECT a.id,a.user_id,a.title,a.location,a.frequency,a.next_digest_at,u.email
      FROM job_alerts a JOIN users u USING(user_id)
      WHERE a.email_enabled=true AND a.next_digest_at<=now()
      ORDER BY a.next_digest_at LIMIT 40`;
    for (const alert of alerts) {
      const period = alert.frequency === "weekly" ? "7 days" : "1 day";
      const since = new Date(new Date(alert.next_digest_at).getTime() - (alert.frequency === "weekly" ? 7 : 1) * 86400000);
      const matches = await sql`SELECT j.job_id,j.title,j.location,c.name AS company_name FROM jobs j
        JOIN companies c USING(company_id) WHERE j.is_active=true AND j.created_at>=${since.toISOString()}
        AND (${alert.title}='' OR j.title ILIKE '%'||${alert.title}||'%')
        AND (${alert.location}='' OR COALESCE(j.location,'') ILIKE '%'||${alert.location}||'%')
        ORDER BY j.created_at DESC LIMIT 8`;
      if (matches.length) {
        const list = matches.map((job) => `<li style="margin:12px 0"><a href="${escape(process.env.PUBLIC_URL || "http://localhost")}/jobs/${job.job_id}"><strong>${escape(job.title)}</strong></a> · ${escape(job.company_name)} · ${escape(job.location || "Location not listed")}</li>`).join("");
        const accepted = await send(alert.email, `New roles for ${alert.title || alert.location || "your job alert"}`, "New roles picked for you", `<p>These recent openings match your HireHeaven alert:</p><ul>${list}</ul><p>You can change or remove this alert from your workspace.</p>`);
        if (!accepted) continue;
      }
      await sql`UPDATE job_alerts SET next_digest_at=now()+${period}::interval
        WHERE id=${alert.id} AND next_digest_at=${alert.next_digest_at}`;
    }

    const reminders = await sql`SELECT m.id,m.scheduled_at,m.meeting_url,candidate.email AS candidate_email,
        recruiter.email AS recruiter_email,j.title,m.status
      FROM interview_meetings m JOIN applications a USING(application_id) JOIN jobs j USING(job_id)
      JOIN users candidate ON candidate.user_id=m.candidate_id JOIN users recruiter ON recruiter.user_id=m.recruiter_id
      WHERE m.reminder_sent_at IS NULL AND m.status IN ('Proposed','Accepted')
        AND m.scheduled_at>now()+interval '23 hours' AND m.scheduled_at<=now()+interval '24 hours'
      ORDER BY m.scheduled_at LIMIT 40`;
    for (const meeting of reminders) {
      const when = new Date(meeting.scheduled_at).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" });
      const body = `A HireHeaven interview for <strong>${escape(meeting.title)}</strong> is scheduled for <strong>${escape(when)}</strong>.${meeting.meeting_url ? ` <a href="${escape(meeting.meeting_url)}">Open meeting link</a>.` : ""}`;
      const candidateSent = await send(meeting.candidate_email, `Interview reminder · ${meeting.title}`, "Your interview is coming up", body);
      const recruiterSent = await send(meeting.recruiter_email, `Interview reminder · ${meeting.title}`, "Interview reminder", body);
      if (candidateSent && recruiterSent)
        await sql`UPDATE interview_meetings SET reminder_sent_at=now() WHERE id=${meeting.id} AND reminder_sent_at IS NULL`;
    }
  } catch (error) {
    console.error("Scheduled email notifications could not be processed", error);
  } finally {
    running = false;
  }
}

export function startNotificationScheduler() {
  if (timer) return;
  timer = setInterval(() => void processNotifications(), 60_000);
  timer.unref?.();
}

export function stopNotificationScheduler() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
