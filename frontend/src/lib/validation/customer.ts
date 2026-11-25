import { z } from "zod";

/** Client-side mirror of the server rules (the server stays the authority). */
export const MESSAGES = {
  name: "Nama wajib diisi (2–100 karakter)",
  email: "Email tidak valid",
  phone: "Nomor HP tidak valid",
  password: "Kata sandi minimal 8 karakter berisi huruf dan angka",
  passwordConfirmation: "Konfirmasi kata sandi tidak cocok",
  passwordSameAsEmail: "Kata sandi tidak boleh sama dengan email",
  passwordRequired: "Kata sandi wajib diisi",
  currentPassword: "Kata sandi lama wajib diisi",
  samePassword: "Kata sandi baru harus berbeda dari kata sandi lama",
  license: "Nomor SIM tidak valid",
  address: "Alamat maksimal 255 karakter",
} as const;

const PHONE_PATTERN = /^(?:08\d{8,13}|\+?628\d{7,12})$/;

export const cleanPhone = (value: string) => value.trim().replace(/[\s\-.()]/g, "");

const name = z.string().trim().min(2, MESSAGES.name).max(100, MESSAGES.name);
const email = z
  .string()
  .trim()
  .min(1, MESSAGES.email)
  .max(254, MESSAGES.email)
  .pipe(z.email(MESSAGES.email));
const phone = z.string().refine((value) => PHONE_PATTERN.test(cleanPhone(value)), MESSAGES.phone);
const newPassword = z
  .string()
  .min(8, MESSAGES.password)
  .max(72, MESSAGES.password)
  .regex(/[A-Za-z]/, MESSAGES.password)
  .regex(/\d/, MESSAGES.password);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, MESSAGES.passwordRequired),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({ name, email, phone, password: newPassword, password_confirmation: z.string() })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: MESSAGES.passwordConfirmation,
  })
  .refine((data) => data.password.toLowerCase() !== data.email.trim().toLowerCase(), {
    path: ["password"],
    message: MESSAGES.passwordSameAsEmail,
  });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: newPassword, password_confirmation: z.string() })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: MESSAGES.passwordConfirmation,
  });

export const profileSchema = z.object({
  name,
  phone,
  address: z.string().trim().max(255, MESSAGES.address),
  license_number: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[A-Za-z0-9]{12,16}$/.test(value), MESSAGES.license),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, MESSAGES.currentPassword),
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: MESSAGES.passwordConfirmation,
  })
  .refine((data) => data.password !== data.current_password, {
    path: ["password"],
    message: MESSAGES.samePassword,
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
