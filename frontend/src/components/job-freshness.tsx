import { formatJobDate } from "@/lib/job-dates";
import type { Job } from "@/type";

export default function JobFreshness({ job }: { job: Job }) {
  return (
    <ul className="space-y-1 text-sm">
      <li>{job.application_deadline ? <>
        {job.is_active ? "Apply by " : "Application deadline "}
        <time dateTime={job.application_deadline}>{formatJobDate(job.application_deadline)}</time>
        {" (IST)"}
      </> : "No application deadline listed"}</li>
      <li>{job.last_confirmed_at ? <>
        Confirmed by recruiter on <time dateTime={job.last_confirmed_at}>{formatJobDate(job.last_confirmed_at)}</time>
      </> : "Recruiter confirmation pending"}</li>
    </ul>
  );
}
