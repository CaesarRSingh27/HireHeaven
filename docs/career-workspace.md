# Career, hiring, and campus workspaces

Open `/workspace` from the navigation or account page. All records are saved to Postgres. The screens use the existing light and dark themes.

## Candidates

- Save a job from its card, then return to it in the workspace.
- Create role/location alerts. New matching listings appear in the workspace. Optionally enable daily or weekly email digests; each alert can stay in-app only.
- Follow an application timeline with its original submission date and each recruiter status update.
- Review proposed interview times from recruiters, accept or decline invitations, and open the optional meeting link from the workspace.
- Open a listing to compare its requirements with profile skills and optional pasted resume text. The skill percentage measures explicit skills found in that text. It is not a hiring prediction. Listings without explicit required skills omit the percentage.
- Use Reze's interview studio to choose a real job, practise a generated question, and request feedback on an answer. Previous sessions remain in the workspace.
- Publish a portfolio with projects and a GitHub link. Publication is opt-in. Public pages share the owner's name, bio, skills, headline, and selected projects. They exclude email, phone, and resume. Unchecking publication makes the public URL unavailable.
- Browse campus drives, consent to sharing name/email with the organiser, and register or withdraw.

Free accounts include five comparisons and three interview questions with feedback per calendar month. Career Plus includes 100 of each. A failed generation restores the question/comparison allowance. Feedback on a generated question does not use another question credit.

## Recruiters

- Create companies and jobs through `/account`. Job forms support explicit skills, minimum experience, graduation year, and annual salary or monthly stipend.
- Use the hiring workspace to filter applicants by role, stage, name, or skills. Stages are Applied (stored as the existing `Submitted` value), Shortlisted, Interview, Hired, and Rejected.
- Propose interview times from an applicant card, include an optional HTTPS meeting link, and track the candidate's response in the recruiter interview calendar.
- Add private applicant notes. Notes are accessible to the job owner and excluded from candidate application responses.
- Basic counts show applications, hires, and recorded listing views. Recruiter Pro adds weekly application trends and returning-applicant engagement.
- Views are deduplicated per job, day, and salted browser signature. IP and user agent are hashed together before storage. Views begin at feature activation, while application counts include historical records, so the reported ratio is descriptive rather than a cohort conversion rate.
- Buy a Featured job promotion for an owned active listing. Sponsored listings are labelled and sort ahead of organic results until the promotion expires.

## Campus organisers

Campus uses recruiter accounts. An active Campus plan permits publishing drives with college, eligibility, graduation year, and registration deadline. Organisers see registrations only for their own drives, can update placement stages, and can download CSV reports. Students explicitly consent before sharing their name and email. Withdrawing removes their registration from the report.

## Plans and activation

| Plan | Price | Access |
|---|---|---|
| Career Plus | INR 199 | 30 days |
| Recruiter Pro | INR 1,499 | 30 days |
| Featured job | INR 299 | 7 days for one listing |
| Campus | INR 2,999 | 30 days |

These are initial product prices, defined on the payment service. The frontend loads them from `GET /api/payment/plans`. Each purchase is one-time and does not automatically renew. Repeat purchases extend the remaining access period. Existing legacy subscription orders continue to activate the original subscription field.

Razorpay checkout creates a server-priced order tied to the account and selected product. Signed verification or a signed webhook atomically claims the order and grants access. Repeated callbacks cannot extend access twice. No feature grants paid access based on a frontend flag.

## Configuration and operations

Email notifications use the existing SMTP settings and the `send-mail` Kafka topic. The job service checks due daily/weekly alert digests and sends one reminder about 24 hours before proposed or accepted interviews. Application status changes and interview proposals/responses also use email. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optional `SMTP_FROM` for delivery; without valid SMTP credentials, email cannot be delivered. Set `PUBLIC_URL` to the site origin so email links use the correct host.

Reze can retrieve current public job listings and, for a signed-in candidate asking about their own history, their application statuses. The frontend requests this context from the authenticated job service and sends only selected listing/status fields to Gemini for that reply. Recruiter records and another candidate's applications are never included. General website questions continue to work without a signed-in session.

AI career tools are made by the job service through an internal-key-protected utils endpoint. Gemini receives the job description and candidate-supplied profile/resume text or interview answer for those tools.

`db/migrations/003_career_workspace.sql` and `db/migrations/004_application_timeline_notifications_interviews.sql` document the additive migrations. The job service applies the schema at startup. The payment service adds product columns to its order table. Existing users, jobs, applications, and legacy orders remain supported. Run standalone migration statements without an enclosing transaction when extending Postgres enums.

```powershell
docker compose up -d --build job user utils payment frontend
docker compose restart nginx
docker compose ps
```

After container replacement, restarting nginx refreshes its upstream DNS addresses.

Useful endpoints under `/api/job/growth` include `/overview`, `/saved`, `/alerts`, `/reze-context`, `/portfolio`, `/match/:jobId`, `/interview`, `/recruiter`, `/meetings`, `/meetings/:id/respond`, `/drives`, and `/campus`. Authentication protects all private endpoints. Public portfolio reads return only opted-in fields. Public drive reads expose the published drive description and organiser name.
