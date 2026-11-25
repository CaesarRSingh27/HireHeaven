"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Keep password/email auth usable when Clerk has not been configured yet.
  if (!publishableKey) return children;

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
