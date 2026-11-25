"use client";

import Loading from "@/components/loading";
import Cookies from "js-cookie";
import { useEffect } from "react";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      window.location.replace("/login?oauthError=provider_error");
      return;
    }

    Cookies.set("token", token, {
      expires: 15,
      secure: window.location.protocol === "https:",
      sameSite: "lax",
      path: "/",
    });

    // Remove the short-lived URL fragment before a full reload initializes auth state.
    window.history.replaceState(null, "", window.location.pathname);
    window.location.replace("/");
  }, []);

  return <Loading />;
}
