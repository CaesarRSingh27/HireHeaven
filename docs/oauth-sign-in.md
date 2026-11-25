# Google and LinkedIn sign-in

HireHeaven's auth microservice supports OAuth 2.0 authorization-code sign-in for Google and LinkedIn OpenID Connect. Provider secrets stay on the auth service; they are never passed to the frontend.

## Local Docker setup

Create a **Web application** OAuth client for Google and an app with **Sign In with LinkedIn using OpenID Connect** enabled for LinkedIn. Add the callback URLs shown below to each provider's allowed redirect URIs:

```text
http://localhost/api/auth/oauth/google/callback
http://localhost/api/auth/oauth/linkedin/callback
```

If the app is hosted somewhere other than `http://localhost`, replace that origin with the public URL and set both `PUBLIC_URL` and `OAUTH_CALLBACK_BASE_URL` in the ignored root `.env` file. Register the resulting full callback URLs with both providers.

For host-based local development without nginx, set `OAUTH_CALLBACK_BASE_URL=http://localhost:5000` in `services/auth/.env` and register these callbacks instead:

```text
http://localhost:5000/api/auth/oauth/google/callback
http://localhost:5000/api/auth/oauth/linkedin/callback
```

For Docker, add the provider credentials to the root `.env`. For host-based local development, add them to `services/auth/.env`:

```dotenv
GOOGLE_CLIENT_ID=your-google-web-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

Then rebuild and restart the services:

```sh
docker compose up -d --build auth frontend
```

The auth service exposes `GET /api/auth/oauth/providers`; the UI uses this to enable only providers with both credentials configured. The existing `GEMINI_API_KEY` is for Gemini model access and cannot be used as a Google OAuth client credential.

## Account behavior

- New social accounts are created with the selected role (jobseeker by default) and verified provider email. Name and profile picture are prefilled where supplied.
- Phone number, resume, bio, and password can be added later. Jobseekers are asked for a resume when they apply for a job.
- If a verified provider email matches an existing account, the provider identity is linked to that account. Passwords are never sent to Google or LinkedIn.
- OAuth state is random, short-lived, stored in Redis, and consumed once. The session token is returned in the callback URL fragment and removed from the address bar by the frontend callback page.
