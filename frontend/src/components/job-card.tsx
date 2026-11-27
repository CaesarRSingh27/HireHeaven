"use client";
import { useAppData } from "@/context/AppContext";
import { Job } from "@/type";
import toast from "react-hot-toast";
import { workspaceApi, errorMessage } from "@/lib/workspace";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle,
  DollarSign,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import JobFreshness from "./job-freshness";

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { user, btnLoading, applyJob, applications } = useAppData();

  const applyJobHandler = (id: number) => {
    applyJob(id);
  };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (user?.role === "jobseeker") workspaceApi("/saved").then(result => setSaved(result.data.includes(job.job_id))).catch(() => {});
  }, [user?.user_id, job.job_id]);
  async function toggleSave() {
    setSaving(true);
    try { await workspaceApi(`/saved/${job.job_id}`, "PUT", { saved: !saved }); setSaved(!saved); }
    catch (error) { toast.error(errorMessage(error)); } finally { setSaving(false); }
  }
  const [applied, setApplied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    if (applications && job.job_id) {
      applications.forEach((item: any) => {
        if (item.job_id === job.job_id) setApplied(true);
      });
    }
  }, [applications, job.job_id]);

  async function reportListing(event: React.FormEvent) {
    event.preventDefault();
    setReportBusy(true);
    try {
      await workspaceApi(`/reports/${job.job_id}`, "POST", { reason: reportReason });
      toast.success("Thanks. Our team will review this listing.");
      setReportOpen(false);
      setReportReason("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-[380px] transition-all duration-300 border-2 hover:border-primary/60 hover:-translate-y-1 group">
      {job.featured_until && new Date(job.featured_until) > new Date() && <span className="workspace-sponsored">Sponsored opening</span>}
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Building2 size={16} />
              <span>{job.company_name}</span>{job.company_verified && <span className="verified-company-badge"><CheckCircle size={13} /> Verified</span>}
            </div>
          </div>

          <Link href={`/company/${job.company_id}`} className="shrink-0">
            <div className="w-14 h-14 rounded-xl border-2 overflow-hidden hover:scale-105 transition-transform bg-background">
              <img
                src={job.company_logo}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <MapPin size={14} />
              <span className="font-medium">{job.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base font-semibold">
            <DollarSign size={18} className="text-green-600" />
            <span>₹ {job.salary} {job.salary_period === "monthly" ? "/ month" : "P.A"}</span>
          </div>
        </div>
        <div className="text-muted-foreground"><JobFreshness job={job} /></div>
      </CardHeader>

      <div className="px-6 workspace-tags"><span className="workspace-chip">{job.job_type}</span><span className="workspace-chip">{job.work_location}</span>{job.experience_years === 0 && <span className="workspace-chip">Freshers welcome</span>}{user?.role === "jobseeker" && <button type="button" disabled={saving} onClick={() => void toggleSave()} className="workspace-save">{saved ? "Saved ✓" : "Save job"}</button>}</div>
      <CardContent className="flex flex-col gap-3 pt-4 border-t">
        <div className="flex w-full gap-2">
          <Link href={`/jobs/${job.job_id}`} className="flex-1">
            <Button variant={"outline"} className="w-full gap-2 group/btn">
              View Details{" "}
              <ArrowRight
                size={16}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </Button>
          </Link>

          {user && user.role === "jobseeker" && (
            <>
              {applied ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-medium text-sm bg-green-100 dark:bg-green-900/30 rounded-md px-3 py-2">
                  <CheckCircle size={15} />
                  Applied
                </div>
              ) : (
                <>
                  {job.is_active !== false && (
                    <Button
                      disabled={btnLoading}
                      onClick={() => applyJobHandler(job.job_id)}
                      className="flex-1 gap-2"
                    >
                      <Briefcase size={16} />
                      Easy Apply
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {(user?.role === "jobseeker" || user?.role === "recruiter") && <div className="job-report-area"><button type="button" className="job-report-toggle" onClick={() => setReportOpen((open) => !open)}>{reportOpen ? "Cancel report" : "Report listing"}</button>{reportOpen && <form className="job-report-form" onSubmit={reportListing}><label htmlFor={`report-${job.job_id}`}>Tell us what looks wrong</label><textarea id={`report-${job.job_id}`} value={reportReason} onChange={(event) => setReportReason(event.target.value)} minLength={10} maxLength={1000} required placeholder="For example, misleading details or a suspicious request" /><button disabled={reportBusy || reportReason.trim().length < 10}>{reportBusy ? "Sending…" : "Submit report"}</button></form>}</div>}

        {job.is_active === false && (
          <div className="w-full text-center text-sm text-red-600 bg-red-100 dark:bg-red-900/30 rounded-md px-3 py-2 font-medium">
            Applications Closed
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
