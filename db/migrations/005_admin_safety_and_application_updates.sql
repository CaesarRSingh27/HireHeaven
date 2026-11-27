-- Apply after 004. PostgreSQL requires the enum addition to commit before it
-- is used by an INSERT, so run the first statement separately if your SQL
-- runner wraps the complete file in one transaction.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_note TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderation_note TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS job_reports (
  id BIGSERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Dismissed')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS job_reports_one_pending_per_reporter ON job_reports(job_id, reporter_id) WHERE status = 'Pending';
CREATE INDEX IF NOT EXISTS job_reports_status_created ON job_reports(status, created_at DESC);
