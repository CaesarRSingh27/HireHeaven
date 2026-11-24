import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  isStrongPassword,
  isValidRole,
  isValidPhone,
} from "./validate.js";

test("email validation", () => {
  assert.equal(isValidEmail("a@b.co"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail(undefined), false);
});

test("password policy", () => {
  assert.equal(isStrongPassword("abc12345"), true);
  assert.equal(isStrongPassword("short1"), false);
  assert.equal(isStrongPassword("onlyletters"), false);
  assert.equal(isStrongPassword("12345678"), false);
  assert.equal(isStrongPassword("a1".repeat(40)), false);
});

test("role validation", () => {
  assert.equal(isValidRole("jobseeker"), true);
  assert.equal(isValidRole("recruiter"), true);
  assert.equal(isValidRole("admin"), false);
});

test("phone validation", () => {
  assert.equal(isValidPhone("+91 98765-43210"), true);
  assert.equal(isValidPhone("abc"), false);
});
