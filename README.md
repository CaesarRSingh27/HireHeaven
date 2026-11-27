# HireHeaven - Microservice Job Portal

HireHeaven brings job discovery, candidate profiles, recruiter tools, resume feedback, and career guidance into one application. It includes a responsive interface with light and dark themes, a custom H emblem and wordmark, and Reze, the website's AI assistant.

Built with Next.js 16, React 19, Tailwind CSS 4, five Node/Express TypeScript services, Postgres (Neon), Redis, Kafka, and an nginx gateway.

## Career and hiring tools

The [career workspace guide](docs/career-workspace.md) covers the candidate workspace, saved jobs and in-app alerts, resume-to-job comparisons, Reze interview practice, public portfolios, recruiter pipelines and analytics, sponsored listings, and college placement drives.

Free candidates get five comparisons and three interview questions with feedback per calendar month. One-time plans are Career Plus (INR 199 / 30 days), Recruiter Pro (INR 1,499 / 30 days), Featured job (INR 299 / 7 days), and Campus (INR 2,999 / 30 days). Prices are served by the payment service, and paid access activates after signed Razorpay verification.

## Features and navigation

| Page | What you can do |
|---|---|
| Home, `/` | Explore the platform and open AI career guidance and resume analysis |
| About, `/about` | Learn about HireHeaven's mission, candidate journey, and values |
| Find a job, `/jobs` | Browse and filter openings, open job details, and apply |
| Account, `/account` | Manage your profile, resume, skills, and applications, or access recruiter tools |
| Company, `/company/[id]` | View a company's details |
| Register / sign in, `/register` and `/login` | Use email and password or Google, LinkedIn, and GitHub through Clerk |
| Contact us, `/contact` | Find contact details and prepare a message in WhatsApp |
| Workspace, `/workspace` | Save jobs, manage alerts and portfolios, practise interviews, manage hiring, or organise campus placements |
| Public portfolios, `/talent/[slug]` | View a candidate’s opted-in projects, skills, and profile |
| Subscription, `/subscribe` | Access the Razorpay subscription checkout |

Recruiters can create company profiles, post jobs, and review applicants through the account area. Social registration lets users start with a minimal profile and add the remaining details later.

### Reze assistant

Click Reze's floating avatar to open the chat panel. Reze answers questions about navigating HireHeaven, finding jobs, candidate profiles, recruiter tools, career guidance, and resume analysis.

The frontend sends up to 12 recent messages to `POST /api/utils/chat`. Replies use Gemini through the utils service. Configure `GEMINI_API_KEY` in the root Docker environment, or `API_KEY_GEMINI` in `services/utils/.env` for local service development. Reze provides guidance based on the site's features and cannot inspect live accounts, applications, or job inventory. General assistant chat history is held in the component's memory and clears when the page reloads. Interview practice sessions in the workspace are saved to Postgres.

### Contact messages

The contact page uses **caesarkrish@gmail.com** and **+91 7376433661** for WhatsApp. Submitting the form opens WhatsApp with the visitor's name, email, and message filled in. The visitor must press **Send in WhatsApp** to deliver it.

### Design and assets

The interface supports light and dark themes, responsive layouts, custom typography, and illustrated character accents. The three journey cards on the About page use text and icons. The HireHeaven emblem is stored in `frontend/public/hireheaven-mark.svg` and is also used as the browser icon.

```
Browser --> nginx :80/:443 --+--> frontend (Next.js)      :3000
                             +--> /api/auth     auth      :5000  --> Postgres, Redis, Kafka(producer)
                             +--> /api/utils    utils     :5001  --> Cloudinary, Gemini, Kafka(consumer) --> SMTP
                             +--> /api/user     user      :5002  --> Postgres
                             +--> /api/job      job       :5003  --> Postgres, Kafka(producer)
                             +--> /api/payment  payment   :5004  --> Postgres, Razorpay
```

`/api/utils/upload` and `/api/utils/delete` are **internal only**: backend services call them with the shared
`INTERNAL_API_KEY`, and nginx returns 404 for them from outside.

## Run everything with Docker (recommended)

Windows PowerShell:

```powershell
.\scripts\gen-secrets.ps1       # creates .env with random JWT_SEC + INTERNAL_API_KEY
notepad .env                     # fill DB_URL, Razorpay, Cloudinary, SMTP, Gemini
docker compose up -d --build
docker compose ps                # wait until everything is "healthy"
Start-Process http://localhost
```

macOS / Linux / Git Bash:

```bash
sh scripts/gen-secrets.sh
nano .env
docker compose up -d --build
docker compose ps                # wait until everything is "healthy"
open http://localhost            # on Linux, use xdg-open instead
```

Start order is enforced by healthchecks: `kafka, redis, utils -> auth -> job -> user, payment -> nginx`
(auth creates `users`, job creates `jobs/applications`, which the other services read).

## Local development (no Docker for the app)

1. Start infra only: `docker compose up -d kafka redis` (add `ports: ["9092:9092"]` to kafka if you run services on the host and set `KAFKA_ADVERTISED_LISTENERS` to `localhost:9092`).
2. For each service: `cd services/<name> && cp .env.example .env && npm install && npm run dev`.
3. Frontend: `cd frontend && cp .env.example .env.local` (uncomment the per-service URLs) `&& npm install && npm run dev`.

## Project structure

```text
frontend/            Next.js interface, routes, components, and public assets
services/auth/       Email/password, social sign-in, and account authentication
services/user/       Profiles, resumes, and user data
services/job/        Companies, jobs, and applications
services/utils/      Uploads, email consumer, Gemini tools, and Reze chat
services/payment/    Razorpay orders, verification, and webhooks
deploy/nginx/        Gateway and HTTPS configuration
db/                  Schema reference and migrations
scripts/             Environment secret generation
docs/                OAuth setup and reference guides
```

## Updating a running local installation

If an ignored root `.env` already exists, use it when restarting the stack. The secret generation scripts create a new file and refuse to overwrite an existing one.

```powershell
# Rebuild the frontend after UI or public configuration changes
docker compose up -d --build --no-deps frontend

# Rebuild all services after changes across the application
docker compose up -d --build

# Inspect running services and recent logs
docker compose ps
docker compose logs --tail=100 frontend auth utils
```

Keep credentials in the ignored environment files. Commit source code and placeholder configuration from `.env.example`.
## Configuration

| Variable | Used by | Notes |
|---|---|---|
| `DB_URL` | auth, job, user, payment | Neon/Postgres connection string |
| `JWT_SEC` | auth, job, user, payment | must be identical everywhere; changing it logs everyone out |
| `INTERNAL_API_KEY` | auth, job, user, utils | service-to-service upload/delete key |
| `Redis_url`, `Kafka_Broker` | auth / job / utils | set automatically by compose |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | payment (+ key id in frontend build) | |
| `SUBSCRIPTION_PRICE_INR` | payment | default 119 |
| `CLOUDINARY_*`, `SMTP_*`, `GEMINI_API_KEY` | utils | |
| `GOOGLE_CLIENT_ID` / `_SECRET`, `LINKEDIN_CLIENT_ID` / `_SECRET` | auth | Optional OAuth sign-in credentials; keep secrets in the ignored root `.env` |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | frontend + auth | Clerk development sign-in; the publishable key is public, keep the secret key only in `.env` |
| `OAUTH_CALLBACK_BASE_URL` | auth | Public app origin used to build provider callback URLs; defaults to `http://localhost` |
| `CORS_ORIGINS` | all services | optional; irrelevant behind nginx (same origin) |

`NEXT_PUBLIC_*` frontend variables are baked in at **build** time - rebuild the frontend image after changing them.

### Social sign-in

Social sign-in creates a minimal account without requiring a password, phone number, bio, or resume up front. Clerk's development instance provides shared Google, LinkedIn, and GitHub OAuth credentials; configure its keys in the ignored environment files. See [OAuth provider setup](docs/oauth-sign-in.md). Direct Google/LinkedIn OAuth credentials remain available as an alternative.

### Resume PDF delivery (Cloudinary)

Cloudinary Free product environments block PDF and ZIP delivery by default. To make uploaded resumes viewable, open **Product environment settings → Security** in the Cloudinary Console and enable **Allow delivery of PDF and ZIP files**. Resume links are public Cloudinary URLs, so anyone who obtains a link can view that resume. Save the setting; if a previously blocked URL still returns an error, allow time for the CDN's cached denial to expire or invalidate the asset.

## Payments (Razorpay)

1. Put the key id/secret in `.env`.
2. In the Razorpay dashboard add a webhook: URL `https://<your-domain>/api/payment/webhook`, event `payment.captured`, and choose a secret; put the same value in `RAZORPAY_WEBHOOK_SECRET`.
3. Orders are stored in `payment_orders`; an order can be redeemed exactly once (atomic SQL), by the verify endpoint **or** the webhook, whichever arrives first.

## HTTPS

```bash
export DOMAIN=jobs.example.com
mkdir -p deploy/certbot/www deploy/certbot/conf
docker compose up -d nginx                                   # HTTP up, serves the ACME challenge
docker compose run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email you@example.com --agree-tos
sed "s/__DOMAIN__/$DOMAIN/g" deploy/nginx/nginx.tls.conf.template > deploy/nginx/nginx.conf
docker compose restart nginx
docker compose --profile tls up -d certbot                   # auto-renewal
```
Then set `PUBLIC_URL=https://$DOMAIN` in `.env` and `docker compose up -d`.

## Database

Each service creates and indexes its own tables on start (`CREATE ... IF NOT EXISTS`). `db/schema.sql` is the consolidated reference.
If your database predates this version run `db/migrations/001_openings_integer.sql` once. The auth service applies the OAuth account migration at startup; its SQL is also available in `db/migrations/002_oauth_accounts.sql`. Career and hiring additions are applied by the job and payment services at startup and documented in `db/migrations/003_career_workspace.sql`.

## CI / CD

- `.github/workflows/ci.yml`: type-check + tests per service, frontend build, Docker builds, compose validation.
- `.github/workflows/deploy.yml`: manual SSH deploy (`git pull && docker compose up -d --build`). Secrets are listed at the top of the file.

## Security notes

- Never commit `.env`. If any real keys were ever shared (zips, chats, screenshots), rotate them: Neon password, Razorpay secret, Cloudinary secret, Gmail app password, Gemini key, JWT secret.
- Auth routes are rate limited; passwords need 8+ chars with a letter and a number; file uploads support PDF/PNG/JPEG/WEBP up to 25 MB.
- Public AI endpoints (`/career`, `/resume-analyser`) are rate limited per IP (5/min) to protect the Gemini quota.

## Known limitations / ideas

- All DB-backed services share one Postgres database and read each other's tables (a "distributed monolith"); splitting per service would need APIs or events between them.
- The JWT lives in a JS-readable cookie (no logout revocation, 15 day expiry). An httpOnly cookie + refresh tokens would be stronger.
- No email verification, no admin role, and no company edit endpoint. Job alerts appear in-app. Gemini tools require an available model and quota.
- Kafka and Redis are single-node containers (fine for a small deployment, not highly available).

## Reference guides

- [Kafka setup guide](docs/reference/kafka-setup-guide.pdf)
- [Resume analyser guide](docs/reference/resume-analyser-guide.pdf)
