"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ClerkCallbackPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="p-8 text-center">Social sign-in is not configured.</main>;
  }
  return <ClerkCallbackHandler />;
}

function ClerkCallbackHandler() {
  const router = useRouter();

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        window.location.replace(decorateUrl("/auth/clerk-complete"));
      }}
      navigateToSignIn={() => router.replace("/login?oauthError=provider_error")}
      navigateToSignUp={() => router.replace("/auth/clerk-continue")}
    />
  );
}
