ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ;
ALTER TABLE jobs ALTER COLUMN last_confirmed_at SET DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_jobs_active_deadline ON jobs(application_deadline)
  WHERE is_active AND application_deadline IS NOT NULL;

ALTER TABLE placement_registrations ADD COLUMN IF NOT EXISTS attendance TEXT NOT NULL DEFAULT 'Unmarked'
  CHECK (attendance IN ('Unmarked', 'Attended', 'Absent'));
