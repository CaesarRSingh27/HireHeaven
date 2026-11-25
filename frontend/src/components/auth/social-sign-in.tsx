"use client";

import { auth_service } from "@/context/AppContext";
import { useSignIn } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Provider = "google" | "linkedin";
type ProviderStatus = Record<Provider, boolean>;

const providers: { id: Provider; label: string; mark: string }[] = [
  { id: "google", label: "Google", mark: "G" },
  { id: "linkedin", label: "LinkedIn", mark: "in" },
];

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SocialSignIn({
  role,
}: {
  role?: "jobseeker" | "recruiter";
}) {
  return clerkConfigured ? (
    <ClerkSocialSignIn role={role} />
  ) : (
    <DirectOAuthSignIn role={role} />
  );
}

function ClerkSocialSignIn({ role }: { role?: "jobseeker" | "recruiter" }) {
  const { signIn } = useSignIn();
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);

  async function begin(provider: Provider) {
    if (!signIn || busyProvider) return;
    setBusyProvider(provider);
    try {
      if (role) window.sessionStorage.setItem("hireheaven:signup-role", role);
      else window.sessionStorage.removeItem("hireheaven:signup-role");
      const { error } = await signIn.sso({
        strategy: provider === "google" ? "oauth_google" : "oauth_linkedin_oidc",
        redirectUrl: `${window.location.origin}/auth/clerk-complete`,
        redirectCallbackUrl: `${window.location.origin}/auth/clerk-callback`,
      });
      if (error) throw error;
    } catch {
      setBusyProvider(null);
      toast.error(
        `${provider === "google" ? "Google" : "LinkedIn"} sign-in is not enabled in the Clerk development dashboard yet.`
      );
    }
  }

  return (
    <div className="social-auth-section">
      <div className="social-auth-buttons">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-auth-button"
            disabled={!signIn || busyProvider !== null}
            onClick={() => void begin(provider.id)}
          >
            <span className={`social-provider-icon ${provider.id}`} aria-hidden="true">
              {provider.mark}
            </span>
            <span>
              {busyProvider === provider.id
                ? "Connecting…"
                : `Continue with ${provider.label}`}
            </span>
          </button>
        ))}
      </div>
      <p className="social-auth-hint">
        Secure sign-in powered by Clerk. New accounts can finish their profile later.
      </p>
    </div>
  );
}

function DirectOAuthSignIn({ role }: { role?: "jobseeker" | "recruiter" }) {
  const [status, setStatus] = useState<ProviderStatus>({
    google: false,
    linkedin: false,
  });

  useEffect(() => {
    let active = true;
    axios
      .get(`${auth_service}/api/auth/oauth/providers`)
      .then(({ data }) => {
        if (active) setStatus(data.providers);
      })
      .catch(() => {
        if (active) setStatus({ google: false, linkedin: false });
      });

    const query = new URLSearchParams(window.location.search);
    const error = query.get("oauthError");
    if (error) {
      const message =
        error === "cancelled"
          ? "Sign-in was cancelled. You can try again whenever you’re ready."
          : error === "provider_not_configured"
            ? "Social sign-in needs provider credentials in the local .env file."
            : "Social sign-in could not be completed. Please try again.";
      toast.error(message);
      query.delete("oauthError");
      const search = query.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search ? `?${search}` : ""}`
      );
    }

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="social-auth-section">
      <div className="social-auth-buttons">
        {providers.map((provider) => {
          const enabled = status[provider.id];
          const query = role ? `?role=${encodeURIComponent(role)}` : "";
          return (
            <a
              key={provider.id}
              className={`social-auth-button${enabled ? "" : " is-unavailable"}`}
              href={`${auth_service}/api/auth/oauth/${provider.id}${query}`}
              aria-disabled={!enabled}
              onClick={(event) => {
                if (!enabled) event.preventDefault();
              }}
            >
              <span className={`social-provider-icon ${provider.id}`} aria-hidden="true">
                {provider.mark}
              </span>
              <span>Continue with {provider.label}</span>
            </a>
          );
        })}
      </div>
      {!status.google && !status.linkedin && (
        <p className="social-auth-hint">
          Email and password sign-in is ready. Google and LinkedIn sign-in will appear
          here after their OAuth client credentials are configured.
        </p>
      )}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="social-auth-divider" aria-hidden="true">
      <span>or continue with email</span>
    </div>
  );
}
