import { sql } from "./utils/db.js";

export async function initGrowthDb() {
  await sql`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'Shortlisted'`;
  await sql`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'Interview'`;
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS recruiter_note TEXT NOT NULL DEFAULT ''`;
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
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id,title,location))`;
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
