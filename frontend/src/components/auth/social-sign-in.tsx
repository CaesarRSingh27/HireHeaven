"use client";

import { auth_service } from "@/context/AppContext";
import { useSignIn } from "@clerk/nextjs";
import { Github } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Provider = "google" | "linkedin" | "github";
type DirectProvider = Exclude<Provider, "github">;
type ProviderStatus = Record<DirectProvider, boolean>;

const clerkProviders: { id: Provider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "github", label: "GitHub" },
];

const directProviders: { id: DirectProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "linkedin", label: "LinkedIn" },
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
        strategy: ({
          google: "oauth_google",
          linkedin: "oauth_linkedin_oidc",
          github: "oauth_github",
        } as const)[provider],
        redirectUrl: `${window.location.origin}/auth/clerk-complete`,
        redirectCallbackUrl: `${window.location.origin}/auth/clerk-callback`,
      });
      if (error) throw error;
    } catch {
      setBusyProvider(null);
      toast.error(
        `${clerkProviders.find((option) => option.id === provider)?.label} sign-in could not be started. Please try again.`
      );
    }
  }

  return (
    <div className="social-auth-section">
      <div className="social-auth-buttons">
        {clerkProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-auth-button social-auth-button--icon"
            disabled={!signIn || busyProvider !== null}
            aria-label={
              busyProvider === provider.id
                ? `Connecting to ${provider.label}`
                : `Continue with ${provider.label}`
            }
            title={provider.label}
            onClick={() => void begin(provider.id)}
          >
            <span className={`social-provider-icon ${provider.id}`} aria-hidden="true">
              <ProviderLogo provider={provider.id} />
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
        {directProviders.map((provider) => {
          const enabled = status[provider.id];
          const query = role ? `?role=${encodeURIComponent(role)}` : "";
          return (
            <a
              key={provider.id}
              className={`social-auth-button social-auth-button--icon${enabled ? "" : " is-unavailable"}`}
              href={`${auth_service}/api/auth/oauth/${provider.id}${query}`}
              aria-disabled={!enabled}
              aria-label={`Continue with ${provider.label}`}
              title={provider.label}
              onClick={(event) => {
                if (!enabled) event.preventDefault();
              }}
            >
              <span className={`social-provider-icon ${provider.id}`} aria-hidden="true">
                <ProviderLogo provider={provider.id} />
              </span>
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

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider === "github") {
    return <Github size={22} strokeWidth={2.1} />;
  }

  if (provider === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" role="presentation">
        <path
          fill="currentColor"
          d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.36 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.14 20.45H3.58V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88l3.69-2.84Z" />
      <path fill="#EA4335" d="M12 4.36c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0A11 11 0 0 0 2.15 7.06l3.69 2.84C6.71 7.3 9.14 4.36 12 4.36Z" />
    </svg>
  );
}

export function AuthDivider() {
  return (
    <div className="social-auth-divider" aria-hidden="true">
      <span>or continue with email</span>
    </div>
  );
}
