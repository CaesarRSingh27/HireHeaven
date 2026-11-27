"use client";
import { Job } from "@/type";
import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { job_service } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Briefcase, Filter, MapPin, Search, X } from "lucide-react";
import Loading from "@/components/loading";
import JobCard from "@/components/job-card";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const locations: string[] = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Chennai",
  "Remote",
];

const emptyFilters = { job_type: "", work_location: "", experience: "", graduation_year: "", skill: "", min_salary: "", salary_period: "", verified_only: "" };

const JobsPage = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [extra, setExtra] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const token = Cookies.get("token");
  const requestId = useRef(0);
  const ref = useRef<HTMLButtonElement>(null);

  async function fetchJobs() {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${job_service}/api/job/all?${new URLSearchParams({ title, location, ...extra, limit: "12", page: String(page) })}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (currentRequest !== requestId.current) return;
      setJobs(data); setHasMore(data.length === 12); setError("");
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setError("Jobs could not be loaded. Please try again.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [title, location, extra, page]);
  useEffect(() => { setPage(1); }, [title, location, extra]);

  const clickEvent = () => {
    ref.current?.click();
  };

  const clearFilter = () => {
    setTitle("");
    setLocation("");
    setExtra(emptyFilters);
    setPage(1);
    fetchJobs();
    ref.current?.click();
  };

  const hasActiveFilters = title || location || Object.values(extra).some(Boolean);
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Explore <span className="text-primary">opportunities</span>
              </h1>
              <p className="text-base text-muted-foreground">
                {jobs.length} {jobs.length === 1 ? "open role" : "open roles"} to explore
              </p>
            </div>

            <Button className="gap-2 h-11" onClick={clickEvent}>
              <Filter size={18} /> Filters
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                  Active
                </span>
              )}
            </Button>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm opacity-70">Active Filters:</span>
              {title && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm">
                  <Search size={14} />
                  {title}
                  <button
                    onClick={() => setTitle("")}
                    className="hover:bg-blue-200 dark:bg-blue-800 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm">
                  <MapPin size={14} />
                  {location}
                  <button
                    onClick={() => setLocation("")}
                    className="hover:bg-blue-200 dark:bg-blue-800 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

            </div>
          )}

          <section className="jobs-character-guide" aria-label="Violettee's job search tip">
            <div className="jobs-character-art">
              <Image src="/violettee-anime.webp" alt="Violettee pointing toward the job search" fill sizes="(max-width: 760px) 38vw, 220px" />
            </div>
            <div className="jobs-character-copy">
              <span className="about-eyebrow"><Search size={14} /> Your Next Move</span>
              <h2>Violettee has a point.</h2>
              <p>Tell her what kind of role you’re looking for. A few filters can bring the right opportunities into focus.</p>
              <button className="jobs-guide-link" type="button" onClick={clickEvent}>Explore job filters <Filter size={15} /></button>
            </div>
            <span className="jobs-guide-spark jobs-guide-spark-one" aria-hidden="true">✦</span>
            <span className="jobs-guide-spark jobs-guide-spark-two" aria-hidden="true">✧</span>
          </section>

          <section className="workspace-card mb-6"><div className="workspace-links"><button type="button" onClick={() => setExtra({ ...extra, experience: "0", job_type: "" })}>Freshers welcome</button><button type="button" onClick={() => setExtra({ ...extra, job_type: "Internship", salary_period: "monthly" })}>Paid internships</button><button type="button" onClick={() => setExtra({ ...extra, work_location: "Remote" })}>Remote work</button><a href="/workspace">Saved jobs & alerts →</a></div></section>
          {error && <p role="alert">{error}<button onClick={() => void fetchJobs()}>Retry</button></p>}
          {loading ? (
            <Loading />
          ) : (
            <>
              {jobs && jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {jobs.map((job) => (
                    <JobCard job={job} key={job.job_id} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Briefcase size={40} className="opacity-40" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No roles found</h3>
                  <p className="max-w-md mx-auto text-sm text-muted-foreground">
                    Try a different title or location. New opportunities are added as teams grow.
                  </p>
                </div>
              )}
            </>
          )}

        </div>

        <div className="workspace-pagination"><Button variant="outline" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page}</span><Button variant="outline" disabled={!hasMore || loading} onClick={() => setPage(page + 1)}>Next</Button></div>
        <Dialog>
          <DialogTrigger asChild>
            <Button ref={ref} className="hidden"></Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Filter className="text-blue-600" />
                Filter Jobs
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4 max-h-[65vh] overflow-auto">
              <div className="workspace-form">
                <label>Employer verification
                  <select value={extra.verified_only} onChange={event => setExtra({ ...extra, verified_only: event.target.value })}>
                    <option value="">All employers</option>
                    <option value="true">Verified employers only</option>
                  </select>
                </label>
                <label>Job type<select value={extra.job_type} onChange={event => setExtra({ ...extra, job_type: event.target.value })}><option value="">Any type</option>{["Full-time","Part-time","Contract","Internship"].map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Work arrangement<select value={extra.work_location} onChange={event => setExtra({ ...extra, work_location: event.target.value })}><option value="">Any arrangement</option>{["On-site","Remote","Hybrid"].map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Your experience in years<input type="number" min="0" max="50" value={extra.experience} onChange={event => setExtra({ ...extra, experience: event.target.value })} placeholder="0 for fresher roles" /></label>
                <label>Graduation year<input type="number" min="2000" max="2100" value={extra.graduation_year} onChange={event => setExtra({ ...extra, graduation_year: event.target.value })} /></label>
                <label>Required skill<input value={extra.skill} onChange={event => setExtra({ ...extra, skill: event.target.value })} placeholder="React, Python…" /></label>
                <label>Pay period<select value={extra.salary_period} onChange={event => setExtra({ ...extra, salary_period: event.target.value })}><option value="">Any period</option><option value="annual">Annual salary</option><option value="monthly">Monthly stipend / salary</option></select></label>
                <label>Minimum pay in INR<input type="number" min="0" value={extra.min_salary} onChange={event => setExtra({ ...extra, min_salary: event.target.value })} /></label>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Search size={16} />
                  Search by job title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g. Product designer"
                  className="h-11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MapPin size={16} />
                  Location
                </Label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 px-3 border-2 border-gray-300 rounded-md bg-transparent focus:outline-none focus:ring2"
                >
                  <option value="">All Locations</option>
                  {locations.map((e) => (
                    <option value={e} key={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant={"outline"}
                onClick={clearFilter}
                className="flex-1"
              >
                Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JobsPage;
