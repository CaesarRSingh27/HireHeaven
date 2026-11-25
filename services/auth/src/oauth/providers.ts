export type OAuthProvider = "google" | "linkedin";

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
}

export function parseOAuthProvider(value: string): OAuthProvider | null {
  return value === "google" || value === "linkedin" ? value : null;
}

export function getOAuthProviderConfig(provider: OAuthProvider) {
  const isGoogle = provider === "google";
  const config: OAuthProviderConfig = {
    clientId: process.env[isGoogle ? "GOOGLE_CLIENT_ID" : "LINKEDIN_CLIENT_ID"] || "",
    clientSecret:
      process.env[isGoogle ? "GOOGLE_CLIENT_SECRET" : "LINKEDIN_CLIENT_SECRET"] || "",
    authorizationEndpoint: isGoogle
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : "https://www.linkedin.com/oauth/v2/authorization",
    tokenEndpoint: isGoogle
      ? "https://oauth2.googleapis.com/token"
      : "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoEndpoint: isGoogle
      ? "https://openidconnect.googleapis.com/v1/userinfo"
      : "https://api.linkedin.com/v2/userinfo",
    scopes: isGoogle ? ["openid", "email", "profile"] : ["openid", "profile", "email"],
  };
  return config;
}

export function isOAuthProviderConfigured(provider: OAuthProvider) {
  const config = getOAuthProviderConfig(provider);
  return Boolean(config.clientId && config.clientSecret);
}

export function getOAuthCallbackUrl(provider: OAuthProvider) {
  const baseUrl =
    process.env.OAUTH_CALLBACK_BASE_URL ||
    process.env.Frontend_Url ||
    "http://localhost";
  return new URL(`/api/auth/oauth/${provider}/callback`, baseUrl).toString();
}

export function getFrontendUrl(path: string) {
  const baseUrl = process.env.Frontend_Url || "http://localhost";
  return new URL(path, baseUrl);
}
