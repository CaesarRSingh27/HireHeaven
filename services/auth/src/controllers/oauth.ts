import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sql } from "../utils/db.js";
import { redisClient } from "../utils/redis.js";
import { TryCatch } from "../utils/TryCatch.js";
import { isValidEmail } from "../utils/validate.js";
import {
  getFrontendUrl,
  getOAuthCallbackUrl,
  getOAuthProviderConfig,
  isOAuthProviderConfigured,
  parseOAuthProvider,
  type OAuthProvider,
} from "../oauth/providers.js";

const availableProviders = ["google", "linkedin"] as const;

export const oauthProviders = (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    providers: Object.fromEntries(
      availableProviders.map((provider) => [
        provider,
        isOAuthProviderConfigured(provider),
      ])
    ),
  });
};

export const startOAuth = TryCatch(async (req: Request, res: Response) => {
  const provider = parseOAuthProvider(
    typeof req.params.provider === "string" ? req.params.provider : ""
  );
  if (!provider) {
    res.status(404).json({ message: "Unsupported sign-in provider" });
    return;
  }

  if (!isOAuthProviderConfigured(provider)) {
    res.status(503).json({
      message: `${provider === "google" ? "Google" : "LinkedIn"} sign-in is not configured yet`,
    });
    return;
  }

  const role = req.query.role === "recruiter" ? "recruiter" : "jobseeker";
  const state = randomBytes(32).toString("hex");
  await redisClient.set(
    `oauth:${provider}:${state}`,
    JSON.stringify({ role }),
    { EX: 600 }
  );

  const config = getOAuthProviderConfig(provider);
  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", getOAuthCallbackUrl(provider));
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scopes.join(" "));
  authorizationUrl.searchParams.set("state", state);
  if (provider === "google") {
    authorizationUrl.searchParams.set("prompt", "select_account");
  }

  res.redirect(302, authorizationUrl.toString());
});

interface OAuthProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

async function exchangeAuthorizationCode(
  provider: OAuthProvider,
  code: string
): Promise<OAuthProfile> {
  const config = getOAuthProviderConfig(provider);
  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getOAuthCallbackUrl(provider),
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!tokenResponse.ok) {
    throw new Error("OAuth token exchange failed");
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
  };
  if (!tokenPayload.access_token) {
    throw new Error("OAuth provider returned no access token");
  }

  const profileResponse = await fetch(config.userInfoEndpoint, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!profileResponse.ok) {
    throw new Error("OAuth profile lookup failed");
  }

  return (await profileResponse.json()) as OAuthProfile;
}

function getFailureRedirect(code: string) {
  const url = getFrontendUrl("/login");
  url.searchParams.set("oauthError", code);
  return url.toString();
}

export const oauthCallback = TryCatch(async (req: Request, res: Response) => {
  const provider = parseOAuthProvider(
    typeof req.params.provider === "string" ? req.params.provider : ""
  );
  if (!provider) {
    res.redirect(302, getFailureRedirect("unsupported_provider"));
    return;
  }

  const state = typeof req.query.state === "string" ? req.query.state : "";
  if (!state || state.length > 128) {
    res.redirect(302, getFailureRedirect("invalid_state"));
    return;
  }

  const savedState = await redisClient.getDel(`oauth:${provider}:${state}`);
  if (!savedState) {
    res.redirect(302, getFailureRedirect("expired_state"));
    return;
  }

  if (req.query.error || typeof req.query.code !== "string") {
    res.redirect(302, getFailureRedirect("cancelled"));
    return;
  }

  if (!isOAuthProviderConfigured(provider)) {
    res.redirect(302, getFailureRedirect("provider_not_configured"));
    return;
  }

  try {
    const stateData = JSON.parse(savedState) as { role?: string };
    const profile = await exchangeAuthorizationCode(provider, req.query.code);

    if (
      typeof profile.sub !== "string" ||
      profile.sub.length === 0 ||
      profile.sub.length > 255 ||
      typeof profile.email !== "string" ||
      profile.email_verified !== true
    ) {
      res.redirect(302, getFailureRedirect("verified_email_required"));
      return;
    }

    const email = profile.email.trim().toLowerCase();
    if (email.length > 255 || !isValidEmail(email)) {
      res.redirect(302, getFailureRedirect("verified_email_required"));
      return;
    }

    const name = (
      profile.name?.trim() ||
      [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim() ||
      email.split("@")[0]
    ).slice(0, 255);
    const picture =
      typeof profile.picture === "string" && profile.picture.length <= 255
        ? profile.picture
        : null;

    const [identity] = await sql`
      SELECT user_id FROM oauth_identities
      WHERE provider = ${provider} AND provider_subject = ${profile.sub}
    `;

    let userId: number;
    if (identity) {
      userId = identity.user_id;
    } else {
      const [existingUser] = await sql`
        SELECT user_id FROM users WHERE LOWER(email) = ${email}
      `;

      let accountId = existingUser?.user_id;
      if (!accountId) {
        const role = stateData.role === "recruiter" ? "recruiter" : "jobseeker";
        const [createdUser] = await sql`
          INSERT INTO users (name, email, password, phone_number, role, profile_pic)
          VALUES (${name}, ${email}, NULL, NULL, ${role}, ${picture})
          RETURNING user_id
        `;
        accountId = createdUser.user_id;
      }

      await sql`
        INSERT INTO oauth_identities (provider, provider_subject, user_id)
        VALUES (${provider}, ${profile.sub}, ${accountId})
        ON CONFLICT (provider, provider_subject) DO NOTHING
      `;

      const [linkedIdentity] = await sql`
        SELECT user_id FROM oauth_identities
        WHERE provider = ${provider} AND provider_subject = ${profile.sub}
      `;
      if (!linkedIdentity || linkedIdentity.user_id !== accountId) {
        res.redirect(302, getFailureRedirect("account_link_conflict"));
        return;
      }
      userId = accountId;
    }

    const token = jwt.sign({ id: userId }, process.env.JWT_SEC as string, {
      expiresIn: "15d",
    });
    const callbackUrl = getFrontendUrl("/auth/callback");
    callbackUrl.hash = new URLSearchParams({ token }).toString();
    res.redirect(302, callbackUrl.toString());
  } catch {
    res.redirect(302, getFailureRedirect("provider_error"));
  }
});
