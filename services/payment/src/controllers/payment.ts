import { TryCatch } from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sql } from "../utils/db.js";
import { instance } from "../utils/razorpay.js";
import crypto from "crypto";

export const plans = [
  {
    id: "career",
    name: "Career Plus",
    price: 199,
    days: 30,
    role: "jobseeker",
    features: [
      "100 job comparisons per month",
      "100 interview questions with feedback per month",
      "Custom portfolio URL and editorial theme",
    ],
  },
  {
    id: "recruiter",
    name: "Recruiter Pro",
    price: 1499,
    days: 30,
    role: "recruiter",
    features: [
      "12-week application analytics",
      "Returning applicant engagement",
      "Listing views and conversion metrics",
    ],
  },
  {
    id: "featured",
    name: "Featured job",
    price: 299,
    days: 7,
    role: "recruiter",
    features: [
      "Seven days of sponsored placement",
      "Clearly labelled in search results",
    ],
  },
  {
    id: "college",
    name: "Campus",
    price: 2999,
    days: 30,
    role: "recruiter",
    features: [
      "Organise placement drives",
      "Student registration and placement tracking",
      "Export placement reports",
    ],
  },
];
export const getPlans = TryCatch(async (_req, res) => {
  res.json(plans);
});
const safeEqual = (a: string, b: string) => {
  const first = Buffer.from(a),
    second = Buffer.from(b);
  return (
    first.length === second.length && crypto.timingSafeEqual(first, second)
  );
};

// Claim the order and activate its entitlement in one atomic statement.
async function redeemOrder(
  orderId: string,
  paymentId: string,
  userId?: number,
) {
  const rows = await sql`
    WITH paid AS (
      UPDATE payment_orders SET status='paid',payment_id=${paymentId},paid_at=now()
      WHERE order_id=${orderId} AND status='created'
        AND (${userId ?? null}::int IS NULL OR user_id=${userId ?? null}::int)
      RETURNING user_id,plan,job_id
    ), entitlement AS (
      INSERT INTO growth_entitlements(user_id,plan,expires_at)
      SELECT user_id,plan,now()+interval '30 days' FROM paid WHERE plan IN ('career','recruiter','college')
      ON CONFLICT(user_id,plan) DO UPDATE SET expires_at=GREATEST(growth_entitlements.expires_at,now())+interval '30 days'
      RETURNING user_id
    ), promotion AS (
      UPDATE jobs j SET featured_until=GREATEST(COALESCE(j.featured_until,now()),now())+interval '7 days'
      FROM paid WHERE paid.plan='featured' AND j.job_id=paid.job_id RETURNING j.job_id
    ), legacy AS (
      UPDATE users u SET subscription=GREATEST(COALESCE(u.subscription,now()),now())+interval '30 days'
      FROM paid WHERE u.user_id=paid.user_id AND paid.plan IN ('legacy','career') RETURNING u.user_id
    ) SELECT user_id FROM paid`;
  return rows[0];
}

export const checkOut = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new ErrorHandler(401, "Sign in to purchase a plan");
  const planId = req.body?.plan ?? "legacy";
  const plan = plans.find((item) => item.id === planId);
  if (!plan && planId !== "legacy") throw new ErrorHandler(400, "Unknown plan");
  if (plan && req.user.role !== plan.role)
    throw new ErrorHandler(
      403,
      "This plan requires a " + plan.role + " account",
    );
  const jobId = planId === "featured" ? Number(req.body.job_id) : null;
  if (planId === "featured") {
    if (!Number.isSafeInteger(jobId) || Number(jobId) < 1)
      throw new ErrorHandler(400, "Select a job to promote");
    const [job] =
      await sql`SELECT job_id FROM jobs WHERE job_id=${jobId} AND posted_by_recuriter_id=${req.user.user_id} AND is_active=true
        AND (application_deadline IS NULL OR application_deadline >= (now() AT TIME ZONE 'Asia/Kolkata')::date)`;
    if (!job) throw new ErrorHandler(404, "Choose one of your active jobs");
  }
  const amount = Math.round(
    (plan?.price ?? Number(process.env.SUBSCRIPTION_PRICE_INR || 119)) * 100,
  );
  const order = await instance.orders.create({
    amount,
    currency: "INR",
    notes: { user_id: String(req.user.user_id), plan: planId },
  });
  await sql`INSERT INTO payment_orders(order_id,user_id,amount,currency,plan,job_id)
    VALUES(${order.id},${req.user.user_id},${amount},'INR',${planId},${jobId})`;
  res.status(201).json({ order });
});

export const paymentVerification = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw new ErrorHandler(401, "Sign in to verify payment");
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body ?? {};
    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    )
      throw new ErrorHandler(400, "Missing payment details");
    const expected = crypto
      .createHmac("sha256", process.env.Razorpay_Secret as string)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    if (!safeEqual(expected, signature))
      throw new ErrorHandler(400, "Invalid payment signature");
    const redeemed = await redeemOrder(orderId, paymentId, req.user.user_id);
    if (!redeemed) {
      const [order] =
        await sql`SELECT * FROM payment_orders WHERE order_id=${orderId}`;
      if (
        !order ||
        order.user_id !== req.user.user_id ||
        order.status !== "paid" ||
        order.payment_id !== paymentId
      )
        throw new ErrorHandler(400, "Unknown or already used order");
    }
    const [updatedUser] =
      await sql`SELECT user_id,name,email,phone_number,role,bio,CASE WHEN resume IS NOT NULL THEN '/api/user/resume' END AS resume,
    profile_pic,profile_pic_public_id,subscription,
    ARRAY(SELECT s.name FROM user_skills us JOIN skills s USING(skill_id) WHERE us.user_id=users.user_id) AS skills FROM users WHERE user_id=${req.user.user_id}`;
    res.json({ message: "Purchase activated successfully", updatedUser });
  },
);

export const razorpayWebhook = TryCatch(async (req, res) => {
  const secret = process.env.Razorpay_Webhook_Secret;
  if (!secret) throw new ErrorHandler(503, "Webhook is not configured");
  const signature = req.headers["x-razorpay-signature"];
  if (typeof signature !== "string" || !Buffer.isBuffer(req.body))
    throw new ErrorHandler(400, "Invalid webhook request");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");
  if (!safeEqual(expected, signature))
    throw new ErrorHandler(400, "Invalid signature");
  const event = JSON.parse(req.body.toString("utf8"));
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id)
      await redeemOrder(payment.order_id, payment.id);
  }
  res.json({ received: true });
});
