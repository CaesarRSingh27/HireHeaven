import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import getBuffer from "../utils/buffer.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { applicationStatusUpdateTemplate } from "../tempelete.js";
import { publishToTopic } from "../producer.js";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORK_LOCATIONS = ["On-site", "Remote", "Hybrid"];
const APPLICATION_STATUSES = ["Submitted", "Rejected", "Hired"];

const internalHeaders = () => ({
  headers: { "x-internal-key": process.env.INTERNAL_API_KEY as string },
});

export const createCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(
        403,
        "Forbidden: Only recruiter can create a company"
      );
    }

    const { name, description, website } = req.body;

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof website !== "string" ||
      !name.trim() ||
      !description.trim() ||
      !website.trim()
    ) {
      throw new ErrorHandler(400, "All the fields required");
    }

    const companyName = name.trim();
    const companyDescription = description.trim();
    const companyWebsite = website.trim();

    if (companyName.length > 255 || companyWebsite.length > 2048) {
      throw new ErrorHandler(400, "Company name or website is too long");
    }

    let parsedWebsite: URL;
    try {
      parsedWebsite = new URL(companyWebsite);
    } catch {
      throw new ErrorHandler(400, "Please enter a valid company website URL");
    }

    if (!["http:", "https:"].includes(parsedWebsite.protocol)) {
      throw new ErrorHandler(400, "Company website must use HTTP or HTTPS");
    }

    const existingCompanies =
      await sql`SELECT company_id FROM companies WHERE name = ${companyName}`;

    if (existingCompanies.length > 0) {
      throw new ErrorHandler(
        409,
        `A company with the name ${name} already exists`
      );
    }

    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "Company Logo file is required");
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "Failed to create file buffer");
    }

    const { data } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      { buffer: fileBuffer.content },
      internalHeaders()
    );

    const [newCompany] =
      await sql`INSERT INTO companies (name, description, website, logo, logo_public_id, recruiter_id) VALUES (${companyName}, ${companyDescription}, ${companyWebsite}, ${data.url}, ${data.public_id}, ${user.user_id}) RETURNING *`;

    res.json({
      message: "Company created successfully",
      company: newCompany,
    });
  }
);

export const deleteCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { companyId } = req.params;

    const [company] =
      await sql`SELECT logo_public_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}`;

    if (!company) {
      throw new ErrorHandler(
        404,
        "Company not found or you're not authorized to delete it."
      );
    }

    await sql`DELETE FROM companies WHERE company_id = ${companyId}`;

    // best effort: do not fail the request if Cloudinary cleanup fails
    axios
      .post(
        `${process.env.UPLOAD_SERVICE}/api/utils/delete`,
        { public_id: company.logo_public_id },
        internalHeaders()
      )
      .catch((error) =>
        console.error("Failed to delete company logo", error.message)
      );

    res.json({
      message: "Company and all associated jobs have been deleted",
    });
  }
);

export const createJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(
      403,
      "Forbidden: Only recruiter can perform this action"
    );
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    openings,
  } = req.body;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof location !== "string" ||
    typeof role !== "string" ||
    !title.trim() ||
    !description.trim() ||
    !location.trim() ||
    !role.trim() ||
    salary === undefined ||
    openings === undefined
  ) {
    throw new ErrorHandler(400, "All the fields required");
  }

  if (title.trim().length > 255 || location.trim().length > 255) {
    throw new ErrorHandler(400, "Job title and location must be 255 characters or fewer");
  }

  if (!JOB_TYPES.includes(job_type)) {
    throw new ErrorHandler(400, `job_type must be one of: ${JOB_TYPES.join(", ")}`);
  }

  if (!WORK_LOCATIONS.includes(work_location)) {
    throw new ErrorHandler(
      400,
      `work_location must be one of: ${WORK_LOCATIONS.join(", ")}`
    );
  }

  const salaryAmount = Number(salary);
  if (
    !Number.isFinite(salaryAmount) ||
    salaryAmount <= 0 ||
    salaryAmount > 99_999_999.99
  ) {
    throw new ErrorHandler(400, "Salary must be a positive amount below 100,000,000");
  }

  if (!Number.isInteger(Number(openings)) || Number(openings) < 1) {
    throw new ErrorHandler(400, "Openings must be a whole number of at least 1");
  }

  const [company] =
    await sql`SELECT company_id FROM companies WHERE company_id = ${company_id} AND recruiter_id = ${user.user_id}`;

  if (!company) {
    throw new ErrorHandler(404, "Company not found");
  }

  const [newJob] =
    await sql`INSERT INTO jobs (title, description, salary, location, role, job_type, work_location, company_id, posted_by_recuriter_id, openings) VALUES (${title.trim()}, ${description.trim()}, ${salaryAmount}, ${location.trim()}, ${role.trim()}, ${job_type}, ${work_location}, ${company_id}, ${user.user_id}, ${openings}) RETURNING *`;

  res.json({
    message: "Job posted successfully",
    job: newJob,
  });
});

export const updateJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(
      403,
      "Forbidden: Only recruiter can perform this action"
    );
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    openings,
    is_active,
  } = req.body;

  const [existingJob] =
    await sql`SELECT posted_by_recuriter_id FROM jobs WHERE job_id = ${req.params.jobId}`;

  if (!existingJob) {
    throw new ErrorHandler(404, "Job not found");
  }

  if (existingJob.posted_by_recuriter_id !== user.user_id) {
    throw new ErrorHandler(403, "Forbiden: You are not allowed");
  }

  if (job_type !== undefined && !JOB_TYPES.includes(job_type)) {
    throw new ErrorHandler(400, `job_type must be one of: ${JOB_TYPES.join(", ")}`);
  }

  if (work_location !== undefined && !WORK_LOCATIONS.includes(work_location)) {
    throw new ErrorHandler(
      400,
      `work_location must be one of: ${WORK_LOCATIONS.join(", ")}`
    );
  }

  if (
    openings !== undefined &&
    (!Number.isInteger(Number(openings)) || Number(openings) < 1)
  ) {
    throw new ErrorHandler(400, "Openings must be a whole number of at least 1");
  }

  // COALESCE keeps the stored value for any field the client did not send
  const [updatedJob] = await sql`UPDATE jobs SET
  title = COALESCE(${title ?? null}, title),
  description = COALESCE(${description ?? null}, description),
  salary = COALESCE(${salary ?? null}, salary),
  location = COALESCE(${location ?? null}, location),
  role = COALESCE(${role ?? null}, role),
  job_type = COALESCE(${job_type ?? null}, job_type),
  work_location = COALESCE(${work_location ?? null}, work_location),
  openings = COALESCE(${openings ?? null}, openings),
  is_active = COALESCE(${is_active ?? null}, is_active)
  WHERE job_id = ${req.params.jobId} RETURNING *;
  `;

  res.json({
    message: "Job updated successfully",
    job: updatedJob,
  });
});

export const getAllCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const companies =
      await sql`SELECT * FROM companies WHERE recruiter_id = ${req.user?.user_id}`;

    res.json(companies);
  }
);

export const getCompanyDetails = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, "Company id is required");
    }

    const [companyData] = await sql`SELECT c.*, COALESCE (
     (
       SELECT json_agg(j.*) FROM jobs j WHERE j.company_id = c.company_id
      ),
      '[]'::json
    ) AS jobs
     FROM companies c WHERE c.company_id = ${id} GROUP BY c.company_id;`;

    if (!companyData) {
      throw new ErrorHandler(404, "Company not found");
    }

    res.json(companyData);
  }
);

export const getAllActiveJobs = TryCatch(async (req, res) => {
  const { title, location } = req.query as {
    title?: string;
    location?: string;
  };

  let querySting = `SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at, c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE j.is_active = true`;

  const values = [];

  let paramIndex = 1;

  if (title) {
    querySting += ` AND j.title ILIKE $${paramIndex}`;
    values.push(`%${title}%`);
    paramIndex++;
  }

  if (location) {
    querySting += ` AND j.location ILIKE $${paramIndex}`;
    values.push(`%${location}%`);
    paramIndex++;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  querySting += ` ORDER BY j.created_at DESC LIMIT $${paramIndex} OFFSET $${
    paramIndex + 1
  }`;
  values.push(limit, (page - 1) * limit);

  const jobs = (await sql.query(querySting, values)) as any[];

  res.json(jobs);
});

export const getSingleJob = TryCatch(async (req, res) => {
  const [job] =
    await sql`SELECT * FROM jobs WHERE job_id = ${req.params.jobId}`;

  if (!job) {
    throw new ErrorHandler(404, "Job not found");
  }

  res.json(job);
});

export const getAllApplicationForJob = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { jobId } = req.params;

    const [job] = await sql`
    SELECT posted_by_recuriter_id FROM jobs WHERE job_id = ${jobId}
    `;

    if (!job) {
      throw new ErrorHandler(404, "job not found");
    }

    if (job.posted_by_recuriter_id !== user.user_id) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    const applications =
      await sql`SELECT * FROM applications WHERE job_id = ${jobId} ORDER BY subscribed DESC, applied_at ASC`;

    res.json(applications);
  }
);

export const updateApplication = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { id } = req.params;

    if (!APPLICATION_STATUSES.includes(req.body.status)) {
      throw new ErrorHandler(
        400,
        `status must be one of: ${APPLICATION_STATUSES.join(", ")}`
      );
    }

    const [application] =
      await sql`SELECT * FROM applications WHERE application_id = ${id}`;

    if (!application) {
      throw new ErrorHandler(404, "Application not found");
    }

    const [job] =
      await sql`SELECT posted_by_recuriter_id, title FROM jobs WHERE job_id = ${application.job_id}`;

    if (!job) {
      throw new ErrorHandler(404, "no job with this id");
    }

    if (job.posted_by_recuriter_id !== user.user_id) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    const [updatedApplication] =
      await sql`UPDATE applications SET status = ${req.body.status} WHERE application_id = ${id} RETURNING *`;

    const message = {
      to: application.applicant_email,
      subject: "Application Update - Job portal",
      html: applicationStatusUpdateTemplate(job.title),
    };

    publishToTopic("send-mail", message).catch((error) => {
      console.error("Failed to publish message to kafka", error);
    });

    res.json({
      message: "Application updated",
      job,
      updatedApplication,
    });
  }
);
