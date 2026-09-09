import { z } from "zod";
import { SUPPORTED_CURRENCIES, VALID_FREQUENCIES } from "./constants";

// ─── Safe Fintech Math Utilities ───────────────────────────────
// Prevents floating-point errors (e.g., 0.1 + 0.2 = 0.30000000000000004) 
// which cause accounting drift in financial applications.

export function safeRound(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

export function safeMultiply(a: number, b: number): number {
  return safeRound(a * b);
}

export function safeDivide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return safeRound(a / b);
}

// ─── Reusable Schema Fragments ─────────────────────────────────
// Driven by centralized constants for absolute consistency across the app.

const currencySchema = z.string().refine((val) => SUPPORTED_CURRENCIES.includes(val.toUpperCase() as any), {
  message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
}).transform((val) => val.toUpperCase());

const frequencySchema = z.string().refine((val) => VALID_FREQUENCIES.includes(val.toLowerCase() as any), {
  message: `Frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`,
}).transform((val) => val.toLowerCase());

// ─── Zod Schemas (Strict Input Validation) ─────────────────────
// .strict() ensures attackers cannot inject extra fields into the payload.

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, "Must include upper, lower, number, and special char"),
  accountType: z.enum(["personal", "business"]),
  company: z.string().max(100).optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
}).strict();

export const executePaymentSchema = z.object({
  recipient: z.string().min(2, "Recipient name is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: currencySchema,
  rail: z.string().min(2, "Payment rail is required"),
  idempotencyKey: z.string().uuid().optional(),
  method: z.string().optional(), // Added for AI engine context
  description: z.string().optional(), // Added for AI engine context
}).strict();

export const executeConversionSchema = z.object({
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  amount: z.number().positive("Amount must be greater than zero"),
  recipient: z.string().min(2, "Recipient name is required"),
  rail: z.string().min(2, "Payment rail is required"),
  idempotencyKey: z.string().uuid().optional(),
}).strict();

export const sendMoneySchema = z.object({
  sourceCurrency: currencySchema,
  amount: z.number().positive("Amount must be greater than zero"),
  recipientName: z.string().min(2, "Recipient name is required"),
  rail: z.string().min(2, "Payment rail is required"),
}).strict();

export const addFundsSchema = z.object({
  currency: currencySchema,
  amount: z.number().positive("Amount must be greater than zero"),
  idempotencyKey: z.string().uuid().optional(),
}).strict();

export const paymentLinkSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  currency: currencySchema,
  description: z.string().min(5, "Description is too short").max(255, "Description is too long"),
}).strict();

export const closeWalletSchema = z.object({
  currency: currencySchema,
  targetCurrency: currencySchema,
}).strict();

export const wireRollSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  recipient: z.string().optional(),
  currency: currencySchema.optional(),
  amount: z.number().positive().optional(),
  frequency: frequencySchema,
  nextRunDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  rail: z.string().optional(),
  items: z.array(z.object({
    recipient: z.string().min(2, "Recipient name is required"),
    currency: currencySchema,
    amount: z.number().positive("Amount must be greater than zero"),
    rail: z.string().min(2, "Payment rail is required"),
  })).optional(),
}).strict();