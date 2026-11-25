"use client";

import { auth_service } from "@/context/AppContext";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Provider = "google" | "linkedin";
type ProviderStatus = Record<Provider, boolean>;

const providers: { id: Provider; label: string; mark: string }[] = [
  { id: "google", label: "Google", mark: "G" },
  { id: "linkedin", label: "LinkedIn", mark: "in" },
];

export default function SocialSignIn({
  role,
}: {
  role?: "jobseeker" | "recruiter";
}) {
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
          Add OAuth credentials to the ignored root .env for Docker, or
          services/auth/.env for local development, to enable these options.
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
