import app from "./app.js";
import dotenv from "dotenv";
import { sql } from "./utils/db.js";
import { connectRedis, redisClient } from "./utils/redis.js";
import { disconnectKafka } from "./producer.js";
import bcrypt from "bcrypt";
import { isStrongPassword, isValidEmail } from "./utils/validate.js";

dotenv.config();

connectRedis().catch(console.error);

async function initDb() {
  try {
    await sql`
    DO $$
    BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter');
       END IF;
    END$$;
    `;

    await sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'`;

    await sql`
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
      )
    `;

    // OAuth-only accounts start with a verified email and can add a phone,
    // resume, and password later from their profile.
    await sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`;
    await sql`ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL`;
    await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'jobseeker'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_note TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL`;
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_identities (
        provider VARCHAR(32) NOT NULL,
        provider_subject VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (provider, provider_subject),
        UNIQUE (provider, user_id)
      )
    `;

    await sql`
     CREATE TABLE IF NOT EXISTS skills (
       skill_id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL UNIQUE
     )
    `;

    await sql`ALTER TABLE skills ALTER COLUMN name TYPE VARCHAR(255)`;

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminName = process.env.ADMIN_NAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail || adminName || adminPassword) {
      if (!adminEmail || !adminName || !adminPassword || !isValidEmail(adminEmail) || !isStrongPassword(adminPassword)) {
        throw new Error("ADMIN_EMAIL, ADMIN_NAME, and a strong ADMIN_PASSWORD must all be configured together");
      }
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await sql`INSERT INTO users(name,email,password,role)
        VALUES(${adminName},${adminEmail},${passwordHash},'admin')
        ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password=EXCLUDED.password,role='admin',is_suspended=false,suspension_note='',suspended_at=NULL,suspended_by=NULL`;
    }

    await sql`
    CREATE TABLE IF NOT EXISTS user_skills(
       user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
       skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
       PRIMARY KEY (user_id, skill_id)
    )
    `;
    console.log("✅ Database tables checked/created successfully");
  } catch (error) {
    console.log("❌ Error initializing database", error);
    process.exit(1);
  }
}

initDb().then(() => {
  const server = app.listen(process.env.PORT, () => {
    console.log(
      `Auth service is running on http://localhost:${process.env.PORT}`
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down auth service`);
    server.close();
    await Promise.allSettled([
      disconnectKafka(),
      redisClient.isOpen ? redisClient.quit() : Promise.resolve(),
    ]);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
