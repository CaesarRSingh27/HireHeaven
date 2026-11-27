# HireHeaven - Microservice Job Portal

HireHeaven brings job discovery, candidate profiles, recruiter tools, resume feedback, and career guidance into one application. It includes a responsive interface with light and dark themes, a custom H emblem and wordmark, and Reze, the website's AI assistant.

Built with Next.js 16, React 19, Tailwind CSS 4, five Node/Express TypeScript services, Postgres (Neon), Redis, Kafka, and an nginx gateway.

## Career and hiring tools

The [career workspace guide](docs/career-workspace.md) covers the candidate workspace, application timelines, email job digests, interview scheduling, live Reze context, saved jobs, resume-to-job comparisons, interview practice, public portfolios, recruiter pipelines, sponsored listings, and college placement drives.

Free candidates get five comparisons and three interview questions with feedback per calendar month. One-time plans are Career Plus (INR 199 / 30 days), Recruiter Pro (INR 1,499 / 30 days), Featured job (INR 299 / 7 days), and Campus (INR 2,999 / 30 days). Prices are served by the payment service, and paid access activates after signed Razorpay verification.

## Features and navigation

| Page | What you can do |
|---|---|
| Home, `/` | Explore the platform and open AI career guidance and resume analysis |
| About, `/about` | Learn about HireHeaven's mission, candidate journey, and values |
| Find a job, `/jobs` | Filter openings by verified employer, check deadlines and recruiter confirmations, and apply |
| Account, `/account` | Manage your profile and skills, download your private resume, and review applications |
| Company, `/company/[id]` | View a company and its openings. Recruiters can set deadlines and confirm that their listings are still open |
| Register / sign in, `/register` and `/login` | Use email and password or Google, LinkedIn, and GitHub through Clerk |
| Contact us, `/contact` | Find contact details and prepare a message in WhatsApp |
| Workspace, `/workspace` | Track applications, manage interviews and hiring, or record campus attendance and review placement outcomes |
| Admin, `/admin` | Review listing reports, verify companies, and suspend accounts or listings |
| Public portfolios, `/talent/[slug]` | View a candidate’s opted-in projects, skills, and profile |
| Subscription, `/subscribe` | Access the Razorpay subscription checkout |

Recruiters can create company profiles, post jobs, and review applicants through the account area. Social registration lets users start with a minimal profile and add the remaining details later.

- **Listing freshness.** Candidates can filter for verified employers and see each listing’s last recruiter confirmation. Optional deadlines run through the listed day in India Standard Time. Expired listings close automatically.
- **Campus placement dashboard.** Organisers can mark attendance, review placement rates by drive and across unique students, follow student progress, and export filtered registrations as CSV.
- **Private resumes.** Candidates can download their own resumes. Recruiters can download the resume submitted to a job they posted. An application keeps its original resume when the candidate updates their profile. See [private resume downloads](#private-resume-downloads) for migration details.

### Reze assistant

Click Reze's floating avatar to open the chat panel. Reze answers questions about navigating HireHeaven, finding jobs, candidate profiles, recruiter tools, career guidance, and resume analysis.

The frontend sends up to 12 recent messages to `POST /api/utils/chat`. For signed-in users, it also requests current openings and (when asked) that candidate's own application statuses from the authenticated job service. Only selected listing and status fields are passed to Gemini; Reze cannot see recruiter records or another user's applications. Configure `GEMINI_API_KEY` in the root Docker environment, or `API_KEY_GEMINI` in `services/utils/.env` for local service development. General assistant chat history is held in the component's memory and clears when the page reloads. Interview practice sessions and scheduled interview appointments are saved to Postgres.

### Application timelines, interview calendar, and email alerts

Candidates can follow a timeline for every application, accept or decline recruiter-proposed interview times, and optionally get daily or weekly matching-job email digests. Recruiters can propose an interview appointment with an optional HTTPS meeting link from an applicant card. Both sides receive interview invitations/response notices and a reminder about 24 hours before the appointment. These messages use the existing SMTP/Kafka service; configure valid SMTP credentials to deliver them. Alert emails are opt-in.

Interview invitations include a Google Calendar link and a downloadable `.ics` file. Candidate profiles show a completion checklist for introductions, skills, resumes, and portfolios. Recruiter pipelines show when each application was last updated and flag submitted applications waiting at least seven days.

### Administration and moderation

An initial administrator can be provisioned by setting `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the ignored root `.env` file before starting the auth service. The password is hashed by the auth service and is never stored in source control. Public registration cannot assign the admin role. Administrators can review reported listings, verify company profiles, pause suspicious job listings, and suspend or reinstate non-admin accounts. Suspended accounts are blocked from authenticated service APIs.

### Contact messages

The contact page uses **caesarkrish@gmail.com** and **+91 7376433661** for WhatsApp. Submitting the form opens WhatsApp with the visitor's name, email, and message filled in. The visitor must press **Send in WhatsApp** to deliver it.

### Design and assets

The interface supports light and dark themes, responsive layouts, custom typography, and illustrated character accents. The three journey cards on the About page use text and icons. The HireHeaven emblem is stored in `frontend/public/hireheaven-mark.svg` and is also used as the browser icon.

### UI roadmap

1. **Shared design system.** Define theme tokens for color, typography, spacing, and elevation. Reuse page headers, cards, status badges, and form fields across both themes.
2. **Find a Job redesign.** Put employer, location, pay, and deadline in a consistent order. Keep active filters visible and give mobile users a filter sheet with a clear **Show results** action.
3. **Workspace layouts.** Use a sidebar on desktop and compact tabs on mobile. Bring upcoming interviews and recent updates forward for candidates. Give recruiters board and table views with consistent stage colors.
4. **Typography and motion.** Keep handwritten accents on selected marketing headings. Add a pause control to the company logo orbit and provide static layouts when visitors prefer reduced motion.
5. **Loading, empty, and error states.** Add skeletons that match the page layout, actionable empty states, and inline validation and retry controls.

## Architecture

```
Browser --> nginx :80/:443 --+--> frontend (Next.js)      :3000
                             +--> /api/auth     auth      :5000  --> Postgres, Redis, Kafka(producer)
                             +--> /api/utils    utils     :5001  --> Cloudinary, Gemini, Kafka(consumer) --> SMTP
                             +--> /api/user     user      :5002  --> Postgres
                             +--> /api/job      job       :5003  --> Postgres, Kafka(producer)
                             +--> /api/payment  payment   :5004  --> Postgres, Razorpay
```

The media upload, delete, and private resume routes under `/api/utils` require the shared `INTERNAL_API_KEY`. nginx blocks external requests to those routes. The user service handles authenticated resume downloads.

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

### Private resume downloads

New resumes are stored as authenticated Cloudinary assets. The API downloads the file on the server and sends it only to the profile owner or, for an application, to the applicant and the recruiter who posted that job. A replacement profile resume does not change any previously submitted resume.

On startup and every 30 minutes, the user service attempts to move existing Cloudinary resume assets to authenticated storage and invalidate the old public URLs. The migration needs working Cloudinary credentials for the cloud that owns those files. Check the user service logs for unavailable files and the Cloudinary console for invalidation status. An existing profile upload can be replaced with a new PDF if its original file is missing. A missing historical submission can only be recovered from its original file or a backup.

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
If your database predates this version run `db/migrations/001_openings_integer.sql` once. The auth service applies the OAuth account migration at startup; its SQL is also available in `db/migrations/002_oauth_accounts.sql`. The job and payment services apply the career and hiring schema additions at startup. Listing deadlines, confirmation timestamps, and campus attendance are documented in `db/migrations/006_job_freshness_and_campus_attendance.sql`.

## CI / CD

- `.github/workflows/ci.yml`: type-check + tests per service, frontend build, Docker builds, compose validation.
- `.github/workflows/deploy.yml`: manual SSH deploy (`git pull && docker compose up -d --build`). Secrets are listed at the top of the file.

## Security notes

- Never commit `.env`. If any real keys were ever shared (zips, chats, screenshots), rotate them: Neon password, Razorpay secret, Cloudinary secret, Gmail app password, Gemini key, JWT secret.
- Auth routes are rate limited. Passwords require at least eight characters, including a letter and a number. Resume uploads require a PDF up to 25 MB.
- Public AI endpoints (`/career`, `/resume-analyser`) are rate limited per IP (5/min) to protect the Gemini quota.

## Known limitations / ideas

- All DB-backed services share one Postgres database and read each other's tables (a "distributed monolith"); splitting per service would need APIs or events between them.
- The JWT lives in a JS-readable cookie (no logout revocation, 15 day expiry). An httpOnly cookie + refresh tokens would be stronger.
- No email verification, admin role, or company edit endpoint. SMTP delivery depends on configured credentials. Gemini tools require an available model and quota.
- Kafka and Redis are single-node containers (fine for a small deployment, not highly available).

## Reference guides

- [Kafka setup guide](docs/reference/kafka-setup-guide.pdf)
- [Resume analyser guide](docs/reference/resume-analyser-guide.pdf)
