import { TryCatch } from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sql } from "../utils/db.js";
import { instance } from "../utils/razorpay.js";
import crypto from "crypto";

const PRICE_INR = Number(process.env.SUBSCRIPTION_PRICE_INR || 119);
const SUBSCRIPTION_DAYS = 30;

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Marks an order as paid AND extends the user's subscription in ONE statement,
 * so it is atomic and idempotent: an order can only be redeemed once, no matter
 * how many times the verify endpoint or the webhook fires.
 *
 * Returns the (safe) user row, or undefined if the order was not redeemable.
 */
async function redeemOrder(
  orderId: string,
  paymentId: string,
  userId?: number
) {
  const rows = await sql`
    WITH paid AS (
      UPDATE payment_orders
      SET status = 'paid', payment_id = ${paymentId}, paid_at = CURRENT_TIMESTAMP
      WHERE order_id = ${orderId}
        AND status = 'created'
        AND (${userId ?? null}::int IS NULL OR user_id = ${userId ?? null}::int)
      RETURNING user_id
    )
    UPDATE users u
    SET subscription = GREATEST(COALESCE(u.subscription, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
                       + make_interval(days => ${SUBSCRIPTION_DAYS}::int)
    FROM paid
    WHERE u.user_id = paid.user_id
    RETURNING u.user_id, u.name, u.email, u.phone_number, u.role, u.bio,
              u.resume, u.resume_public_id, u.profile_pic,
              u.profile_pic_public_id, u.subscription
  `;
  return rows[0];
}

export const checkOut = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    throw new ErrorHandler(401, "No valid User");
  }

  const user_id = req.user.user_id;

  const [user] =
    await sql`SELECT subscription FROM users WHERE user_id = ${user_id}`;

  const subTime = user?.subscription
    ? new Date(user.subscription).getTime()
    : 0;

  if (subTime > Date.now()) {
    throw new ErrorHandler(400, "You already have a subscription");
  }

  const amount = Math.round(PRICE_INR * 100); // paise

  const order = await instance.orders.create({
    amount,
    currency: "INR",
    notes: { user_id: user_id.toString() },
  });

  await sql`
    INSERT INTO payment_orders (order_id, user_id, amount, currency)
    VALUES (${order.id}, ${user_id}, ${amount}, 'INR')
  `;

  res.status(201).json({ order });
});

export const paymentVerification = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "No valid User");
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body ?? {};

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      throw new ErrorHandler(400, "Missing payment details");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.Razorpay_Secret as string)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (!safeEqual(expectedSignature, razorpay_signature)) {
      return res.status(400).json({ message: "Payment Failed" });
    }

    const updatedUser = await redeemOrder(
      razorpay_order_id,
      razorpay_payment_id,
      user.user_id
    );

    if (updatedUser) {
      return res.json({
        message: "Subscription Purchased Successfully",
        updatedUser,
      });
    }

    // Not redeemable now. Distinguish a harmless client retry (already paid with
    // this same payment id) from an unknown order / replay.
    const [order] = await sql`
      SELECT user_id, status, payment_id FROM payment_orders
      WHERE order_id = ${razorpay_order_id}
    `;

    if (
      order &&
      order.user_id === user.user_id &&
      order.status === "paid" &&
      order.payment_id === razorpay_payment_id
    ) {
      return res.json({
        message: "Subscription Purchased Successfully",
        updatedUser: user,
      });
    }

    throw new ErrorHandler(400, "Unknown or already used order");
  }
);

/**
 * Razorpay webhook: grants the subscription even if the user closed the browser
 * before the client-side verify call. Configure in the Razorpay dashboard:
 *   URL:    https://<your-domain>/api/payment/webhook
 *   Events: payment.captured (and/or order.paid)
 *   Secret: same value as Razorpay_Webhook_Secret
 */
export const razorpayWebhook = TryCatch(async (req, res) => {
  const secret = process.env.Razorpay_Webhook_Secret;

  if (!secret) {
    throw new ErrorHandler(503, "Webhook is not configured");
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.body;

  if (typeof signature !== "string" || !Buffer.isBuffer(rawBody)) {
    throw new ErrorHandler(400, "Invalid webhook request");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!safeEqual(expected, signature)) {
    throw new ErrorHandler(400, "Invalid signature");
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;

    if (orderId && payment?.id) {
      await redeemOrder(orderId, payment.id);
    }
  }

  // Always 200 for a correctly signed event so Razorpay stops retrying
  res.json({ received: true });
});
