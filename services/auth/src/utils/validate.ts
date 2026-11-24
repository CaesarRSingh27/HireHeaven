export type Role = "jobseeker" | "recruiter";

export const isValidEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// 8-72 chars (bcrypt ignores anything beyond 72 bytes), at least one letter and one digit
export const isStrongPassword = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 8 &&
  value.length <= 72 &&
  /[A-Za-z]/.test(value) &&
  /\d/.test(value);

export const isValidRole = (value: unknown): value is Role =>
  value === "jobseeker" || value === "recruiter";

export const isValidPhone = (value: unknown): value is string =>
  typeof value === "string" && /^\+?[\d\s-]{7,20}$/.test(value);

export const PASSWORD_RULE_MESSAGE =
  "Password must be 8-72 characters and contain at least one letter and one number";
