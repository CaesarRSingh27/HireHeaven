"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import useRazorpay from "@/components/scriptLoader";
import { payment_service, useAppData } from "@/context/AppContext";
import { workspaceApi, errorMessage } from "@/lib/workspace";
import type { Job } from "@/type";

interface Plan {
  id: string;
  name: string;
  price: number;
  days: number;
  role: string;
  features: string[];
}
export default function SubscriptionPage() {
  const loaded = useRazorpay();
  const { user, loading, setUser } = useAppData();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    axios
      .get(`${payment_service}/api/payment/plans`)
      .then((result) => setPlans(result.data))
      .catch(() =>
        setError("Plans could not be loaded. Please refresh to try again."),
      );
    setJob(new URLSearchParams(window.location.search).get("job") ?? "");
  }, []);
  useEffect(() => {
    if (user?.role === "recruiter")
      workspaceApi("/recruiter")
        .then((result) =>
          setJobs(result.data.jobs.filter((item: Job) => item.is_active)),
        )
        .catch((error) => setError(errorMessage(error)));
  }, [user?.role]);
  async function purchase(plan: Plan) {
    if (!user || !loaded) return;
    setBusy(plan.id);
    try {
      const headers = { Authorization: `Bearer ${Cookies.get("token")}` };
      const { data } = await axios.post(
        `${payment_service}/api/payment/checkout`,
        { plan: plan.id, job_id: Number(job) },
        { headers },
      );
      const checkout = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "HireHeaven",
        description: `${plan.name} · ${plan.days} days`,
        theme: { color: "#8962ec" },
        modal: { ondismiss: () => setBusy("") },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await axios.post(
              `${payment_service}/api/payment/verify`,
              response,
              { headers },
            );
            setUser(result.data.updatedUser);
            toast.success(
              "Your purchase is active. Open your workspace to use it.",
            );
          } catch (error) {
            toast.error(errorMessage(error));
          } finally {
            setBusy("");
          }
        },
      });
      checkout.on("payment.failed", () => {
        setBusy("");
        toast.error("Payment did not complete. You can try again.");
      });
      checkout.open();
    } catch (error) {
      setBusy("");
      toast.error(errorMessage(error));
    }
  }
  return (
    <main className="workspace-page">
      <header className="workspace-heading">
        <span className="workspace-kicker">A little more possibility</span>
        <h1>
          Find your pace.
          <br />
          <em>Choose your plan.</em>
        </h1>
        <p>Start free, then add the tools that suit your next move.</p>
        <Link href="/workspace">Open your workspace →</Link>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="workspace-pricing">
        <section className="workspace-card">
          <span className="workspace-kicker">For everyone starting out</span>
          <h2>Free</h2>
          <strong className="workspace-price">₹0</strong>
          <p>
            Job search, applications, saved jobs, in-app alerts, and a public
            portfolio.
          </p>
          <ul>
            <li>Five job comparisons per calendar month</li>
            <li>Three interview questions with feedback per calendar month</li>
            <li>Basic recruiter pipeline and notes</li>
          </ul>
          <Link href={user ? "/workspace" : "/register"}>Get started →</Link>
        </section>
        {plans.map((plan) => (
          <section className="workspace-card" key={plan.id}>
            <span className="workspace-kicker">
              {plan.role === "jobseeker"
                ? "For your next move"
                : plan.id === "college"
                  ? "For placement teams"
                  : "For hiring teams"}
            </span>
            <h2>{plan.name}</h2>
            <strong className="workspace-price">
              ₹{plan.price.toLocaleString("en-IN")}
            </strong>
            <p>{plan.days} days · one-time purchase</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.id === "featured" && user?.role === "recruiter" && (
              <label>
                Job to promote
                <select
                  value={job}
                  onChange={(event) => setJob(event.target.value)}
                  required
                >
                  <option value="">Select an active job</option>
                  {jobs.map((item) => (
                    <option key={item.job_id} value={item.job_id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!user && !loading ? (
              <Link href="/login">Sign in to choose this plan →</Link>
            ) : (
              <button
                disabled={
                  loading ||
                  !!busy ||
                  !loaded ||
                  user?.role !== plan.role ||
                  (plan.id === "featured" && !job)
                }
                onClick={() => void purchase(plan)}
              >
                {busy === plan.id
                  ? "Opening checkout…"
                  : user?.role !== plan.role
                    ? `For ${plan.role === "jobseeker" ? "candidate" : "recruiter"} accounts`
                    : `Choose ${plan.name}`}
              </button>
            )}
          </section>
        ))}
      </div>
      <p className="workspace-plan-status">
        Plans activate after payment verification. Purchases do not renew
        automatically. AI allowances reset on the first day of each calendar
        month and depend on service availability.
      </p>
    </main>
  );
}
