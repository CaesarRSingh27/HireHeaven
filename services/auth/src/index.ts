import app from "./app.js";
import dotenv from "dotenv";
import { sql } from "./utils/db.js";
import { connectRedis, redisClient } from "./utils/redis.js";
import { disconnectKafka } from "./producer.js";

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

    await sql`
     CREATE TABLE IF NOT EXISTS skills (
       skill_id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL UNIQUE
     )
    `;

    await sql`ALTER TABLE skills ALTER COLUMN name TYPE VARCHAR(255)`;

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
