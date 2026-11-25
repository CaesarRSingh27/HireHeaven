import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sql } from "../utils/db.js";
import { TryCatch } from "../utils/TryCatch.js";
import { isValidEmail } from "../utils/validate.js";

const clerkSecretKey = () => process.env.CLERK_SECRET_KEY?.trim();

export const exchangeClerkSession = TryCatch(
  async (req: Request, res: Response) => {
    const secretKey = clerkSecretKey();
    if (!secretKey) {
      res.status(503).json({ message: "Clerk sign-in is not configured" });
      return;
    }

    const clerkToken = req.body?.clerkToken;
    if (typeof clerkToken !== "string" || clerkToken.length > 16_384) {
      res.status(400).json({ message: "A valid Clerk session is required" });
      return;
    }

    let subject: string;
    try {
      const frontendUrl = process.env.Frontend_Url || "http://localhost";
      const allowedParties = Array.from(
        new Set([
          new URL(frontendUrl).origin,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ])
      );
      const verified = await verifyToken(clerkToken, {
        secretKey,
        authorizedParties: allowedParties,
      });
      if (typeof verified.sub !== "string") throw new Error("Invalid subject");
      subject = verified.sub;
      if (!subject || subject.length > 255) throw new Error("Invalid subject");
    } catch {
      res.status(401).json({ message: "Clerk session could not be verified" });
      return;
    }

    const clerk = createClerkClient({ secretKey });
    const profile = await clerk.users.getUser(subject);
    const primaryEmail = profile.emailAddresses.find(
      (email) => email.id === profile.primaryEmailAddressId
    );
    const email = primaryEmail?.emailAddress.trim().toLowerCase();

    if (
      !primaryEmail ||
      !email ||
      primaryEmail.verification?.status !== "verified" ||
      email.length > 255 ||
      !isValidEmail(email)
    ) {
      res.status(403).json({ message: "A verified email address is required" });
      return;
    }

    const requestedRole = req.body?.role === "recruiter" ? "recruiter" : "jobseeker";
    const name =
      [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
      email.split("@")[0];
    const picture =
      profile.imageUrl && profile.imageUrl.length <= 255 ? profile.imageUrl : null;

    const [identity] = await sql`
      SELECT user_id FROM oauth_identities
      WHERE provider = 'clerk' AND provider_subject = ${subject}
    `;

    let userId: number;
    if (identity) {
      userId = identity.user_id;
    } else {
      const [existingUser] = await sql`
        SELECT user_id FROM users WHERE LOWER(email) = ${email}
      `;
      let accountId = existingUser?.user_id;
      if (!accountId) {
        const [createdUser] = await sql`
          INSERT INTO users (name, email, password, phone_number, role, profile_pic)
          VALUES (${name.slice(0, 255)}, ${email}, NULL, NULL, ${requestedRole}, ${picture})
          RETURNING user_id
        `;
        accountId = createdUser.user_id;
      }

      await sql`
        INSERT INTO oauth_identities (provider, provider_subject, user_id)
        VALUES ('clerk', ${subject}, ${accountId})
        ON CONFLICT (provider, provider_subject) DO NOTHING
      `;
      const [linkedIdentity] = await sql`
        SELECT user_id FROM oauth_identities
        WHERE provider = 'clerk' AND provider_subject = ${subject}
      `;
      if (!linkedIdentity || linkedIdentity.user_id !== accountId) {
        res.status(409).json({ message: "This Clerk account is linked elsewhere" });
        return;
      }
      userId = accountId;
    }

    const token = jwt.sign({ id: userId }, process.env.JWT_SEC as string, {
      expiresIn: "15d",
    });
    res.json({ token, message: "Signed in successfully" });
  }
);
