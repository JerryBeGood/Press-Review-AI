import { z } from "zod";

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Must be a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

const passwordSchema = z
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
