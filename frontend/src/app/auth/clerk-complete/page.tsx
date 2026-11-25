"use client";

import Loading from "@/components/loading";
import { auth_service } from "@/context/AppContext";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function ClerkCompletePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="p-8 text-center">Social sign-in is not configured.</main>;
  }
  return <ClerkCompleteHandler />;
}

function ClerkCompleteHandler() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.replace("/login?oauthError=provider_error");
      return;
    }

    let active = true;
    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error("Missing Clerk session token");
        const role = window.sessionStorage.getItem("hireheaven:signup-role");
        const { data } = await axios.post(
          `${auth_service}/api/auth/oauth/clerk/exchange`,
          { clerkToken, role }
        );
        if (!active) return;

        window.sessionStorage.removeItem("hireheaven:signup-role");
        Cookies.set("token", data.token, {
          expires: 15,
          secure: window.location.protocol === "https:",
          sameSite: "lax",
          path: "/",
        });
        // Reinitialize the existing microservice session from its JWT.
        window.location.replace("/");
      } catch {
        if (!active) return;
        toast.error("We couldn’t finish your sign-in. Please try again.");
        window.location.replace("/login?oauthError=provider_error");
      }
    })();

    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  return <Loading />;
}
