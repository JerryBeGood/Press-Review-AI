import { z } from "zod";

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Must be a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Reusable password validation schema
 * Enforces: min 8 chars, 1 uppercase, 1 number, 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one capital letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

/**
 * Validation schema for registration form
 */
export const registerSchema = z
  .object({
    email: z.string().email({ message: "Must be a valid email address" }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for the registration API endpoint
 */
export const registerApiSchema = z.object({
  email: z.string().email({ message: "Must be a valid email address" }),
  password: passwordSchema,
});

export type RegisterApiInput = z.infer<typeof registerApiSchema>;

/**
 * Validation schema for forgot password form
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Must be a valid email address" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Validation schema for reset password form
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Validation schema for change password form
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Validation schema for change email form
 */
export const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Must be a valid email address" }),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

/**
 * Validation schema for change email API endpoint
 * Includes currentEmail for comparison on the backend
 */
export const changeEmailApiSchema = z
  .object({
    currentEmail: z.string().email(),
    newEmail: z.string().email({ message: "Must be a valid email address" }),
  })
  .refine((data) => data.newEmail !== data.currentEmail, {
    message: "New email must be different from current email",
    path: ["newEmail"],
  });

export type ChangeEmailApiInput = z.infer<typeof changeEmailApiSchema>;

/**
 * Validation schema for delete account
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Password is required to delete account" }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
