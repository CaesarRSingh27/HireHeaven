import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import getBuffer from "../utils/buffer.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";

const internalHeaders = () => ({
  headers: { "x-internal-key": process.env.INTERNAL_API_KEY as string },
});

const removeOldUpload = (publicId: string | null | undefined) => {
  if (!publicId) return;

  axios
    .post(
      `${process.env.UPLOAD_SERVICE}/api/utils/delete`,
      { public_id: publicId },
      internalHeaders()
    )
    .catch((error) =>
      console.error("Failed to remove replaced upload", error.message)
    );
};

export const myProfile = TryCatch(
  async (req: AuthenticatedRequest, res, next) => {
    const user = req.user;

    res.json(user);
  }
);

export const getUserProfile = TryCatch(
  async (req: AuthenticatedRequest, res, next) => {
  const { userId } = req.params;

  if (!/^\d+$/.test(String(userId))) {
    throw new ErrorHandler(400, "Invalid user id");
  }

  const users = await sql`
        SELECT u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription,
        ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
        FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.skill_id
        WHERE u.user_id = ${userId}
        GROUP BY u.user_id;
        `;

  if (users.length === 0) {
    throw new ErrorHandler(404, "User not found");
  }

  const user = users[0];

  user.skills = user.skills || [];

  // Contact details and documents are only visible to the owner or a recruiter
  const isSelf = req.user?.user_id === Number(userId);
  const isRecruiter = req.user?.role === "recruiter";

  if (!isSelf && !isRecruiter) {
    delete user.email;
    delete user.phone_number;
    delete user.resume;
  }

  if (!isSelf) {
    delete user.resume_public_id;
    delete user.profile_pic_public_id;
  }

  res.json(user);
  }
);

export const updateUserProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const { name, phoneNumber, bio } = req.body ?? {};

    if (name === undefined && phoneNumber === undefined && bio === undefined) {
      throw new ErrorHandler(400, "No profile changes were provided");
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim() || name.trim().length > 255)
    ) {
      throw new ErrorHandler(400, "Name must be between 1 and 255 characters");
    }

    if (
      phoneNumber !== undefined &&
      (typeof phoneNumber !== "string" ||
        (phoneNumber.trim() !== "" && !/^\+?[\d\s-]{7,20}$/.test(phoneNumber)))
    ) {
      throw new ErrorHandler(400, "Please enter a valid phone number");
    }

    if (bio !== undefined && (typeof bio !== "string" || bio.length > 10000)) {
      throw new ErrorHandler(400, "About text must be 10,000 characters or fewer");
    }

    const newName = name === undefined ? user.name : name.trim();
    const newPhoneNumber =
      phoneNumber === undefined ? user.phone_number : phoneNumber.trim() || null;
    // An explicit empty string clears the about text; an omitted field keeps it.
    const newBio = bio === undefined ? user.bio : bio;

    const [updatedUser] = await sql`
    UPDATE users SET name = ${newName}, phone_number = ${newPhoneNumber}, bio = ${newBio}
    WHERE user_id = ${user.user_id}
    RETURNING user_id, name, email, phone_number, bio
    `;

    res.json({
      message: "Profile Updated successfully",
      updatedUser,
    });
  }
);

export const updateProfilePic = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "No image file provided");
    }

    const oldPublicId = user.profile_pic_public_id;

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "failed to generate buffer");
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      {
        buffer: fileBuffer.content,
      },
      internalHeaders()
    );

    const [updatedUser] = await sql`
    UPDATE users SET profile_pic = ${uploadResult.url}, profile_pic_public_id = ${uploadResult.public_id} WHERE user_id = ${user.user_id} RETURNING user_id, name, profile_pic;
    `;

    if (oldPublicId !== uploadResult.public_id) removeOldUpload(oldPublicId);

    res.json({
      message: "profile pic updated",
      updatedUser,
    });
  }
);

export const updateResume = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  const file = req.file;

  if (!file) {
    throw new ErrorHandler(400, "No pdf file provided");
  }

  const oldPublicId = user.resume_public_id;

  const fileBuffer = getBuffer(file);

  if (!fileBuffer || !fileBuffer.content) {
    throw new ErrorHandler(500, "failed to generate buffer");
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
    {
      buffer: fileBuffer.content,
    },
    internalHeaders()
  );

  const [updatedUser] = await sql`
    UPDATE users SET resume = ${uploadResult.url}, resume_public_id = ${uploadResult.public_id} WHERE user_id = ${user.user_id} RETURNING user_id, name, resume;
    `;

  if (oldPublicId !== uploadResult.public_id) removeOldUpload(oldPublicId);

  res.json({
    message: "Resume updated",
    updatedUser,
  });
});

export const addSkillToUser = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.user_id;
    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      throw new ErrorHandler(400, "Please provide a skill name");
    }

    if (skillName.trim().length > 255) {
      throw new ErrorHandler(400, "Skill name must be 255 characters or fewer");
    }

    // The Neon HTTP driver runs every statement on its own connection, so a
    // BEGIN/COMMIT block cannot span statements. Both inserts are idempotent
    // upserts, so they are safe to run on their own.
    const users = await sql`SELECT user_id FROM users WHERE user_id = ${userId}`;

    if (users.length === 0) {
      throw new ErrorHandler(404, "User not found.");
    }

    const [skill] =
      await sql`INSERT INTO skills (name) VALUES (${skillName.trim()}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING skill_id`;

    const insertionResult =
      await sql`INSERT INTO user_skills (user_id, skill_id) VALUES (${userId}, ${skill.skill_id}) ON CONFLICT (user_id, skill_id) DO NOTHING RETURNING user_id`;

    const wasSkillAdded = insertionResult.length > 0;

    if (!wasSkillAdded) {
      return res.status(200).json({
        message: "User already possesses this skill",
      });
    }

    res.json({
      message: `Skill ${skillName.trim()} is added successfully`,
    });
  }
);

export const deleteSkillFromUser = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication Required");
    }

    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      throw new ErrorHandler(400, "Please provide a skill name");
    }

    const result = await sql`DELETE FROM user_skills WHERE user_id = ${
      user.user_id
    } AND skill_id = (SELECT skill_id FROM skills WHERE name = ${skillName.trim()}) RETURNING user_id;`;

    if (result.length === 0) {
      throw new ErrorHandler(404, `Skill ${skillName.trim()} was not found`);
    }

    res.json({
      message: `Skill ${skillName.trim()} was deleted successfully`,
    });
  }
);

export const applyForJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "jobseeker") {
    throw new ErrorHandler(403, "Forbidden you are not allowed for this api");
  }

  const applicant_id = user.user_id;

  const resume = user.resume;

  if (!resume) {
    throw new ErrorHandler(
      400,
      "You need to add resume in your profile to apply for this job"
    );
  }

  const { job_id } = req.body;

  if (!job_id) {
    throw new ErrorHandler(400, "job id is required");
  }

  const [job] = await sql`SELECT is_active FROM jobs WHERE job_id = ${job_id}`;

  if (!job) {
    throw new ErrorHandler(404, "No jobs with this id");
  }

  if (!job.is_active) {
    throw new ErrorHandler(400, "Job is not active");
  }

  const now = Date.now();

  const subTime = req.user?.subscription
    ? new Date(req.user.subscription).getTime()
    : 0;

  const isSubscribed = subTime > now;

  let newApplication;

  try {
    [newApplication] =
      await sql`INSERT INTO applications (job_id, applicant_id, applicant_email, resume, subscribed) VALUES (${job_id}, ${applicant_id}, ${user?.email}, ${resume}, ${isSubscribed}) RETURNING *`;
  } catch (error: any) {
    if (error.code === "23505") {
      throw new ErrorHandler(409, "you have already applied to this job.");
    }
    throw error;
  }

  res.json({
    message: "Applied for job successfully",
    application: newApplication,
  });
});

export const getAllaplications = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const applications = await sql`
    SELECT a.*, j.title AS job_title, j.salary AS job_salary, j.location AS job_location FROM applications a JOIN jobs j ON a.job_id = j.job_id WHERE a.applicant_id = ${req.user?.user_id}
  `;

    res.json(applications);
  }
);
