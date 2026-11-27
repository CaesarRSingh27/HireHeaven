import { initGrowthDb } from "./growth-db.js";
import app from "./app.js";
import dotenv from "dotenv";
import { sql } from "./utils/db.js";
import { connectKafka, disconnectKafka } from "./producer.js";
import { startNotificationScheduler, stopNotificationScheduler } from "./notifications.js";

dotenv.config();

connectKafka();

async function initDB() {
  try {
    await sql`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN 
        CREATE TYPE job_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_location') THEN 
        CREATE TYPE work_location AS ENUM ('On-site', 'Remote', 'Hybrid');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN 
        CREATE TYPE application_status AS ENUM ('Submitted', 'Rejected', 'Hired');
        END IF;
    END$$;
    `;

    await sql`
    CREATE TABLE IF NOT EXISTS companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    website TEXT NOT NULL,
    logo VARCHAR(255) NOT NULL,
    logo_public_id VARCHAR(255) NOT NULL,
    recruiter_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `;

    // Existing databases may still have the original VARCHAR(255) column.
    await sql`ALTER TABLE companies ALTER COLUMN website TYPE TEXT`;

    await sql`
    CREATE TABLE IF NOT EXISTS jobs(
    job_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    salary NUMERIC(10,2),
    location VARCHAR(255),
    job_type job_type NOT NULL,
    openings INTEGER NOT NULL,
    role TEXT NOT NULL,
    work_location work_location NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    posted_by_recuriter_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
    )
    `;

    // Existing Neon databases keep the old 255-character column unless it is
    // explicitly widened; job role/department details may be longer.
    await sql`ALTER TABLE jobs ALTER COLUMN role TYPE TEXT`;

    await sql`
    CREATE TABLE IF NOT EXISTS applications(
    application_id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    status application_status NOT NULL DEFAULT 'Submitted',
    resume VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subscribed BOOLEAN,
    UNIQUE (job_id, applicant_id)
    )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_companies_recruiter_id ON companies(recruiter_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(is_active, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id)`;

    await initGrowthDb();

    console.log(
      "Job service database tables checked and created successfully."
    );
  } catch (error) {
    console.log("Error while creating tables", error);
    process.exit(1);
  }
}

initDB().then(() => {
  startNotificationScheduler();
  const server = app.listen(process.env.PORT, () => {
    console.log(
      `Job service is running on http://localhost:${process.env.PORT}`
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down job service`);
    stopNotificationScheduler();
    server.close();
    await disconnectKafka().catch(() => {});
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
