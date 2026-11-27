-- Also applied automatically by services/job/src/growth-db.ts.
-- Existing applications receive a starting timeline event at application time.
CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_events_application_date
  ON application_events(application_id, created_at);
INSERT INTO application_events(application_id,status,note,created_at)
SELECT a.application_id,'Submitted',
  CASE WHEN a.status::text='Submitted' THEN 'Application sent'
       ELSE 'Application sent; earlier status history is unavailable' END,
  a.applied_at FROM applications a
WHERE NOT EXISTS (
  SELECT 1 FROM application_events e WHERE e.application_id=a.application_id
);

ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS next_digest_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS interview_meetings (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  recruiter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Proposed'
    CHECK(status IN ('Proposed','Accepted','Declined','Cancelled','Completed')),
  meeting_url TEXT NOT NULL DEFAULT '',
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interview_meetings_candidate_date
  ON interview_meetings(candidate_id,scheduled_at);
CREATE INDEX IF NOT EXISTS interview_meetings_recruiter_date
  ON interview_meetings(recruiter_id,scheduled_at);
