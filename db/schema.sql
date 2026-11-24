-- Consolidated schema for a FRESH database.
-- You do NOT have to run this: every service creates what it owns on start-up
-- (auth: users/skills/user_skills, job: companies/jobs/applications,
-- payment: payment_orders). It is here for review, DBA tooling and disaster recovery.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
    CREATE TYPE job_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_location') THEN
    CREATE TYPE work_location AS ENUM ('On-site', 'Remote', 'Hybrid');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('Submitted', 'Rejected', 'Hired');
  END IF;
END $$;

-- auth service
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  role user_role NOT NULL,
  bio TEXT,
  resume VARCHAR(255),
  resume_public_id VARCHAR(255),
  profile_pic VARCHAR(255),
  profile_pic_public_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscription TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

-- job service
CREATE TABLE IF NOT EXISTS companies (
  company_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  website VARCHAR(255) NOT NULL,
  logo VARCHAR(255) NOT NULL,
  logo_public_id VARCHAR(255) NOT NULL,
  recruiter_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  salary NUMERIC(10,2),
  location VARCHAR(255),
  job_type job_type NOT NULL,
  openings INTEGER NOT NULL,
  role VARCHAR(255) NOT NULL,
  work_location work_location NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  posted_by_recuriter_id INTEGER NOT NULL,   -- (sic) column name kept for compatibility
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS applications (
  application_id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  status application_status NOT NULL DEFAULT 'Submitted',
  resume VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscribed BOOLEAN,
  UNIQUE (job_id, applicant_id)
);

-- payment service
CREATE TABLE IF NOT EXISTS payment_orders (
  order_id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,                  -- paise
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  status VARCHAR(16) NOT NULL DEFAULT 'created',   -- created | paid
  payment_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMPTZ
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_companies_recruiter_id ON companies(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
