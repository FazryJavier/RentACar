import { describe, expect, it } from "vitest";
import { changePasswordSchema, MESSAGES, profileSchema, registerSchema } from "./customer";

const base = {
  name: "Budi Santoso",
  email: "budi@example.test",
  phone: "0812-3456-7890",
  password: "rahasia123",
  password_confirmation: "rahasia123",
};

function issues(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return (result.error?.issues ?? []).map((issue) => `${String(issue.path[0])}:${issue.message}`);
}

describe("registerSchema", () => {
  it("accepts valid data", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ["abc1234", false],
    ["abcd1234", true],
    [`${"a".repeat(71)}1`, true],
    [`${"a".repeat(72)}1`, false],
    ["abcdefgh", false],
    ["12345678", false],
  ])("password %s → %s", (password, valid) => {
    expect(
      registerSchema.safeParse({ ...base, password, password_confirmation: password }).success,
    ).toBe(valid);
  });

  it("rejects a mismatched confirmation on the confirmation field", () => {
    expect(
      issues(registerSchema.safeParse({ ...base, password_confirmation: "beda12345" })),
    ).toContain(`password_confirmation:${MESSAGES.passwordConfirmation}`);
  });

  it.each([
    ["08123456789", true],
    ["+62 812-3456-7890", true],
    ["0712345678", false],
    ["0812345", false],
    ["08123456789012345", false],
  ])("phone %s → %s", (phone, valid) => {
    expect(registerSchema.safeParse({ ...base, phone }).success).toBe(valid);
  });

  it("rejects a password equal to the email", () => {
    const value = "budi1@example.test";
    expect(
      issues(
        registerSchema.safeParse({
          ...base,
          email: value,
          password: value,
          password_confirmation: value,
        }),
      ),
    ).toContain(`password:${MESSAGES.passwordSameAsEmail}`);
  });
});

describe("profileSchema", () => {
  it.each([
    ["", true],
    ["123456789012", true],
    ["ab1234567890", true],
    ["12345", false],
    ["ABC-123-456-789", false],
  ])("licence %s → %s", (license_number, valid) => {
    expect(
      profileSchema.safeParse({ name: "Budi", phone: "08123456789", address: "", license_number })
        .success,
    ).toBe(valid);
  });
});

describe("changePasswordSchema", () => {
  it("requires a different new password", () => {
    expect(
      issues(
        changePasswordSchema.safeParse({
          current_password: "rahasia123",
          password: "rahasia123",
          password_confirmation: "rahasia123",
        }),
      ),
    ).toContain(`password:${MESSAGES.samePassword}`);
  });
});
