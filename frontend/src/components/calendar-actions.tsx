"use client";

import type { Overview } from "@/lib/workspace";

type Meeting = Overview["meetings"][number];

const utc = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeIcs = (value: string) => value
  .replace(/\\/g, "\\\\")
  .replace(/;/g, "\\;")
  .replace(/,/g, "\\,")
  .replace(/\r?\n/g, "\\n");

export default function CalendarActions({ meeting }: { meeting: Meeting }) {
  const start = new Date(meeting.scheduled_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = `HireHeaven interview · ${meeting.job_title}`;
  const details = [
    meeting.recruiter_name ? `Recruiter: ${meeting.recruiter_name}` : "",
    meeting.candidate_name ? `Candidate: ${meeting.candidate_name}` : "",
    meeting.meeting_url ? `Meeting link: ${meeting.meeting_url}` : "",
    `Invite managed in HireHeaven (${meeting.status})`,
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${utc(start)}/${utc(end)}`,
    details,
    ...(meeting.meeting_url ? { location: meeting.meeting_url } : {}),
  });

  function downloadInvite() {
    const event = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HireHeaven//Interview Calendar//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:hireheaven-meeting-${meeting.id}@hireheaven`,
      `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(start)}`,
      `DTEND:${utc(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(details)}`,
      ...(meeting.meeting_url ? [`URL:${meeting.meeting_url}`, `LOCATION:${escapeIcs(meeting.meeting_url)}`] : []),
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([event], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hireheaven-interview-${meeting.id}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <a href={`https://calendar.google.com/calendar/render?${params.toString()}`} target="_blank" rel="noreferrer">Google Calendar ↗</a>
    <button type="button" onClick={downloadInvite}>Download .ics</button>
  </>;
}
