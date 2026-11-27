import { sql } from "./utils/db.js";

export async function initGrowthDb() {
  await sql`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'Shortlisted'`;
  await sql`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'Interview'`;
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS recruiter_note TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`;
  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderation_note TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE TABLE IF NOT EXISTS job_reports (
    id BIGSERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Reviewed','Dismissed')),
    review_note TEXT NOT NULL DEFAULT '',
    reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS job_reports_one_pending_per_reporter ON job_reports(job_id,reporter_id) WHERE status='Pending'`;
  await sql`CREATE INDEX IF NOT EXISTS job_reports_status_created ON job_reports(status,created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS application_events (
    id BIGSERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS application_events_application_date ON application_events(application_id,created_at)`;
  await sql`INSERT INTO application_events(application_id,status,note,created_at)
    SELECT a.application_id,'Submitted',CASE WHEN a.status::text='Submitted' THEN 'Application sent' ELSE 'Application sent; earlier status history is unavailable' END,a.applied_at FROM applications a
    WHERE NOT EXISTS (SELECT 1 FROM application_events e WHERE e.application_id=a.application_id)`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[] NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_years INTEGER`;
  await sql`ALTER TABLE jobs ALTER COLUMN experience_years DROP NOT NULL`;
  await sql`ALTER TABLE jobs ALTER COLUMN experience_years DROP DEFAULT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS graduation_year INTEGER`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_period TEXT NOT NULL DEFAULT 'annual'`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS growth_entitlements (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, PRIMARY KEY(user_id, plan))`;
  await sql`CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(user_id, job_id))`;
  await sql`CREATE TABLE IF NOT EXISTS job_alerts (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily','weekly')),
    next_digest_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id,title,location))`;
  await sql`ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily'`;
  await sql`ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS next_digest_at TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS portfolios (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    headline TEXT NOT NULL DEFAULT '', projects JSONB NOT NULL DEFAULT '[]',
    github TEXT NOT NULL DEFAULT '', theme TEXT NOT NULL DEFAULT 'classic',
    is_public BOOLEAN NOT NULL DEFAULT false, slug TEXT UNIQUE)`;
  await sql`CREATE TABLE IF NOT EXISTS growth_usage (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feature TEXT NOT NULL, month DATE NOT NULL, count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id,feature,month))`;
  await sql`CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(job_id) ON DELETE SET NULL,
    question TEXT NOT NULL, answer TEXT NOT NULL DEFAULT '', feedback TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS feedback_started_at TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS interview_meetings (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    recruiter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Proposed' CHECK(status IN ('Proposed','Accepted','Declined','Cancelled','Completed')),
    meeting_url TEXT NOT NULL DEFAULT '',
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS interview_meetings_candidate_date ON interview_meetings(candidate_id,scheduled_at)`;
  await sql`CREATE INDEX IF NOT EXISTS interview_meetings_recruiter_date ON interview_meetings(recruiter_id,scheduled_at)`;
  await sql`CREATE TABLE IF NOT EXISTS job_views (
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    visitor TEXT NOT NULL, viewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY(job_id,visitor,viewed_on))`;
  await sql`CREATE TABLE IF NOT EXISTS growth_events (
    id BIGSERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS placement_drives (
    id SERIAL PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    college TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
    graduation_year INTEGER NOT NULL, deadline DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS placement_registrations (
    drive_id INTEGER NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Registered', created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(drive_id,user_id))`;
  await sql`CREATE INDEX IF NOT EXISTS growth_events_user_date ON growth_events(user_id,created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS job_alerts_user ON job_alerts(user_id)`;
}
