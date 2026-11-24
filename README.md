# HireHeaven - Microservice Job Portal

Next.js frontend + five Node/Express (TypeScript) services, Postgres (Neon), Redis, Kafka, behind an nginx gateway.

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
| `CORS_ORIGINS` | all services | optional; irrelevant behind nginx (same origin) |

`NEXT_PUBLIC_*` frontend variables are baked in at **build** time - rebuild the frontend image after changing them.

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
If your database predates this version run `db/migrations/001_openings_integer.sql` once.

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
- No email verification, no admin role, no job delete / company edit endpoints, no frontend pagination UI.
- Kafka and Redis are single-node containers (fine for a small deployment, not highly available).

## Reference guides

- [Kafka setup guide](docs/reference/kafka-setup-guide.pdf)
- [Resume analyser guide](docs/reference/resume-analyser-guide.pdf)
