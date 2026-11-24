import { sql } from "./db.js";

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS payment_orders (
      order_id VARCHAR(64) PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      currency VARCHAR(8) NOT NULL DEFAULT 'INR',
      status VARCHAR(16) NOT NULL DEFAULT 'created',
      payment_id VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id)`;

  console.log("Payment service database tables checked/created successfully.");
}
