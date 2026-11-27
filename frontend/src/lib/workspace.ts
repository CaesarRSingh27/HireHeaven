import axios from "axios";
import Cookies from "js-cookie";
import { job_service } from "@/context/AppContext";
import type { Job } from "@/type";

export const workspaceApi = (path: string, method = "GET", data?: unknown) =>
  axios({
    url: `${job_service}/api/job/growth${path}`,
    method,
    data,
    headers: { Authorization: `Bearer ${Cookies.get("token") ?? ""}` },
  });
export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message ||
      "The request could not be completed. Please try again."
    : "The request could not be completed. Please try again.";
export interface Project {
  title: string;
  description: string;
  url: string;
}
export interface Portfolio {
  headline: string;
  github: string;
  projects: Project[];
  theme: string;
  slug: string;
  is_public: boolean;
}
export interface Interview {
  id: number;
  question: string;
  answer: string;
  feedback: string;
}
export interface Overview {
  entitlements: { plan: string; expires_at: string }[];
  usage: { feature: string; count: number }[];
  saved: Job[];
  alerts: { id: number; title: string; location: string; email_enabled: boolean; frequency: "daily" | "weekly" }[];
  matches: { job_id: number; title: string; company_name: string }[];
  updates: { application_id: number; status: string; title: string; applied_at: string; timeline: { status: string; note: string; created_at: string }[] }[];
  portfolio: Portfolio | null;
  interviews: Interview[];
  meetings: { id: number; application_id: number; scheduled_at: string; status: string; meeting_url: string; job_title: string; recruiter_name?: string; candidate_name?: string }[];
  registrations: {
    drive_id: number;
    title: string;
    college: string;
    status: string;
  }[];
}
export interface Drive {
  id: number;
  college: string;
  title: string;
  description: string;
  graduation_year: number;
  deadline: string;
  organiser: string;
}
export interface Applicant {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  job_id: number;
  job_title: string;
  status: string;
  recruiter_note: string;
  resume: string;
  skills: string[];
}
export interface HiringData {
  jobs: (Job & { applications: number; views: number })[];
  applications: Applicant[];
  funnel: Record<string, number>;
  pro: boolean;
  analytics: { week: string; applications: number }[];
  engagement: { returning_applicants: number }[];
  meetings: NonNullable<Overview["meetings"]>;
}
