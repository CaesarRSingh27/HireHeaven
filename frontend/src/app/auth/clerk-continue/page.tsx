"use client";

import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";
import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ClerkContinuePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="p-8 text-center">Social sign-in is not configured.</main>;
  }
  return <ClerkContinueForm />;
}

function ClerkContinueForm() {
  const { signUp, fetchStatus } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signUp.status === "complete") {
      window.location.replace("/auth/clerk-complete");
    }
  }, [signUp.status]);
  if (signUp.status === "complete") return <Loading />;

  const needsFirstName = signUp.missingFields.includes("first_name");
  const needsLastName = signUp.missingFields.includes("last_name");
  const needsLegalAcceptance = signUp.missingFields.includes("legal_accepted");
  const hasUnsupportedRequirement = signUp.missingFields.some(
    (field) => !["first_name", "last_name", "legal_accepted"].includes(field)
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasUnsupportedRequirement || fetchStatus === "fetching") return;

    setBusy(true);
    try {
      const { error } = await signUp.update({
        ...(needsFirstName ? { firstName } : {}),
        ...(needsLastName ? { lastName } : {}),
        ...(needsLegalAcceptance ? { legalAccepted } : {}),
      });
      if (error) throw error;

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            window.location.replace(decorateUrl("/auth/clerk-complete"));
          },
        });
        if (finalizeError) throw finalizeError;
      }
    } catch {
      toast.error("We couldn’t complete this sign-up. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-gray-300 bg-card p-8 shadow-xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          One last step
        </p>
        <h1 className="mb-3 text-3xl font-bold">Finish your HireHeaven account</h1>
        {hasUnsupportedRequirement ? (
          <div className="space-y-4">
            <p className="text-sm opacity-75">
              Clerk needs another sign-up detail. Continue with email registration to finish your account.
            </p>
            <Link className="text-primary underline" href="/register">
              Continue with email
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={submit}>
            <p className="text-sm opacity-75">
              Add only the details required to continue. You can complete the rest of your profile later.
            </p>
            {needsFirstName && (
              <label className="block space-y-2">
                <span className="text-sm font-medium">First name</span>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>
            )}
            {needsLastName && (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Last name</span>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>
            )}
            {needsLegalAcceptance && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => setLegalAccepted(event.target.checked)}
                  required
                />
                <span>I agree to the authentication provider’s required terms.</span>
              </label>
            )}
            <Button className="w-full" disabled={busy || fetchStatus === "fetching"}>
              {busy || fetchStatus === "fetching" ? "Saving…" : "Continue"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
