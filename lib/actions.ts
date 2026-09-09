"use server";

import { db } from "./db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { 
  createSession, deleteSession, verifySession, 
  hashPassword, verifyPassword, validatePassword 
} from "./auth";
import { getLiveUsdRates } from "./fx";
import {
  registerSchema, loginSchema, executePaymentSchema, 
  executeConversionSchema, sendMoneySchema, addFundsSchema,
  paymentLinkSchema, closeWalletSchema, wireRollSchema,
  safeMultiply, safeDivide
} from "./validations";

// ─── Helper: Generate Secure API Keys ──────────────────────────
function generateApiKey(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

// ─── AUTHENTICATION ─────────────────────────────────────────────

export async function registerUser(rawData: unknown) {
  try {
    const data = registerSchema.parse(rawData);
    const userId = await db.transaction(async (trx) => {
      const existing = await trx`SELECT id FROM users WHERE email = ${data.email}`;
      if (existing.length > 0) throw new Error("An account with this email already exists.");

      const hash = await hashPassword(data.password);
      const userResult = await trx`
        INSERT INTO users (name, email, password_hash, account_type, company) 
        VALUES (${data.name}, ${data.email}, ${hash}, ${data.accountType}, ${data.company || null}) 
        RETURNING id
      `;
      const newUserId = Number(userResult[0].id);

      const defaultWallets = data.accountType === "personal"
        ? [{ currency: "KES", bank: "Wireways Kenya", details: "712 345 678" }, { currency: "USD", bank: "Wireways US", details: "9876 5432 10" }]
        : [{ currency: "USD", bank: "Wireways US", details: "9876 5432 10" }, { currency: "EUR", bank: "Wireways EU", details: "1234 5678 90" }, { currency: "GBP", bank: "Wireways UK", details: "0987 6543 21" }, { currency: "USDC", bank: "Wireways Crypto", details: "0xAbC...123" }, { currency: "KES", bank: "Wireways Kenya", details: "712 345 678" }];

      for (const w of defaultWallets) {
        await trx`INSERT INTO wallets (currency, balance, bank, details, is_active, user_id) VALUES (${w.currency}, 0, ${w.bank}, ${w.details}, 1, ${newUserId})`;
      }
      return newUserId;
    });
    await createSession(userId);
    return { success: true, message: "Account created successfully." };
  } catch (error: any) {
    if (error.name === "ZodError") return { success: false, message: "Invalid input data.", details: error.flatten().fieldErrors };
    console.error("Register error:", error);
    return { success: false, message: error.message || "Failed to create account." };
  }
}

export async function loginUser(rawData: unknown) {
  try {
    const data = loginSchema.parse(rawData);
    const result = await db.execute("SELECT id, password_hash FROM users WHERE email = $1", [data.email]);
    if (result.rows.length === 0) return { success: false, message: "Invalid email or password." };
    const user = result.rows[0] as { id: number; password_hash: string };
    if (!(await verifyPassword(data.password, user.password_hash))) return { success: false, message: "Invalid email or password." };
    await createSession(user.id);
    return { success: true, message: "Logged in successfully." };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, message: "Failed to log in." };
  }
}

export async function logoutUser() {
  await deleteSession();
  return { success: true, message: "Logged out." };
}

// ─── PAYMENT EXECUTION (Atomic & Idempotent) ───────────────────

import { commitJournal } from "./ledger"; // <-- Add this to your top imports!

// ... (keep all your other imports)

export async function executePayment(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  
  try {
    const data = executePaymentSchema.parse(rawData);
    const finalIdempotencyKey = data.idempotencyKey || randomUUID();

    // Check for existing journal to enforce strict idempotency
    const existing = await db.execute(
      "SELECT journal_id FROM transactions WHERE idempotency_key = $1", 
      [finalIdempotencyKey]
    );
    if (existing.rows.length > 0) {
      return { success: true, message: "Payment already processed.", idempotent: true };
    }

    // 1. Find the sender's wallet ID
    const walletRes = await db.execute(
      "SELECT id FROM wallets WHERE currency = $1 AND user_id = $2", 
      [data.currency, Number(session.userId)]
    );
    if (walletRes.rows.length === 0) {
      return { success: false, message: `Wallet for ${data.currency} not found.` };
    }
    const senderWalletId = Number((walletRes.rows[0] as any).id);

    // 2. Define the Double-Entry Journal
    // Debit: Sender's wallet loses money.
    // Credit: "External Rail" (Virtual account representing the money leaving the system)
    const journalEntries = [
      { walletId: senderWalletId, userId: Number(session.userId), type: "debit" as const, amount: data.amount, currency: data.currency },
      { userId: Number(session.userId), type: "credit" as const, amount: data.amount, currency: data.currency } // Virtual credit to balance
    ];

    // 3. Commit to the Immutable Ledger
    const result = await commitJournal(journalEntries, {
      name: data.recipient,
      type: "out",
      rail: data.rail,
      idempotencyKey: finalIdempotencyKey,
    });

    if (!result.success) {
      return { success: false, message: result.message };
    }

    return { 
      success: true, 
      message: `Successfully sent ${data.amount} ${data.currency} to ${data.recipient}`, 
      journalId: result.journalId 
    };
  } catch (error: any) {
    if (error.name === "ZodError") return { success: false, message: "Invalid input data." };
    console.error("Payment execution error:", error);
    return { success: false, message: error.message || "Transaction failed." };
  }
}
export async function executeConversionAndPayment(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  
  try {
    const data = executeConversionSchema.parse(rawData);
    const finalIdempotencyKey = data.idempotencyKey || randomUUID();

    // Check for existing journal to enforce strict idempotency
    const existing = await db.execute(
      "SELECT journal_id FROM transactions WHERE idempotency_key = $1", 
      [finalIdempotencyKey]
    );
    if (existing.rows.length > 0) {
      return { success: true, message: "Conversion already processed.", idempotent: true };
    }

    // 1. Find sender's wallets
    const walletFromRes = await db.execute(
      "SELECT id FROM wallets WHERE currency = $1 AND user_id = $2", 
      [data.fromCurrency, Number(session.userId)]
    );
    const walletToRes = await db.execute(
      "SELECT id FROM wallets WHERE currency = $1 AND user_id = $2", 
      [data.toCurrency, Number(session.userId)]
    );

    if (walletFromRes.rows.length === 0 || walletToRes.rows.length === 0) {
      return { success: false, message: "One or both wallets not found." };
    }

    const walletFromId = Number((walletFromRes.rows[0] as any).id);
    const walletToId = Number((walletToRes.rows[0] as any).id);

    // 2. Get Live FX Rate
    const rates = await getLiveUsdRates();
    const convertedAmount = safeMultiply(data.amount, safeDivide(rates[data.toCurrency] || 1, rates[data.fromCurrency] || 1));

    // 3. Define the Double-Entry Journal
    // Debit: From Wallet (USD)
    // Credit: To Wallet (KES)
    const journalEntries = [
      { walletId: walletFromId, userId: Number(session.userId), type: "debit" as const, amount: data.amount, currency: data.fromCurrency },
      { walletId: walletToId, userId: Number(session.userId), type: "credit" as const, amount: convertedAmount, currency: data.toCurrency }
    ];

    // 4. Commit to the Immutable Ledger
    const result = await commitJournal(journalEntries, {
      name: `Conversion ${data.fromCurrency} → ${data.toCurrency}`,
      type: "conversion",
      rail: "Internal FX",
      idempotencyKey: finalIdempotencyKey,
    });

    if (!result.success) {
      return { success: false, message: result.message };
    }

    return { 
      success: true, 
      message: `Successfully converted ${data.amount} ${data.fromCurrency} to ${convertedAmount} ${data.toCurrency}`, 
      journalId: result.journalId 
    };
  } catch (error: any) {
    if (error.name === "ZodError") return { success: false, message: "Invalid input data." };
    console.error("Conversion error:", error);
    return { success: false, message: error.message || "Conversion failed." };
  }
}

export async function executeSend(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = sendMoneySchema.parse(rawData);
    const transactionUuid = randomUUID();
    await db.transaction(async (trx) => {
      const updateResult = await trx`UPDATE wallets SET balance = balance - ${data.amount} WHERE currency = ${data.sourceCurrency} AND user_id = ${Number(session.userId)} AND is_active = 1 AND balance >= ${data.amount}`;
      if (updateResult.count === 0) throw new Error(`Insufficient ${data.sourceCurrency} balance or wallet not found.`);
      await trx`INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, transaction_uuid, created_at) VALUES (${Number(session.userId)}, ${data.recipientName.trim()}, 'out', ${data.amount}, 'Completed', ${data.rail}, ${data.sourceCurrency}, ${transactionUuid}, NOW())`;
    });
    return { success: true, message: `Successfully sent ${data.amount} ${data.sourceCurrency} via ${data.rail}.` };
  } catch (error: any) {
    console.error("Send error:", error);
    return { success: false, message: error.message || "Transaction failed." };
  }
}

export async function addFunds(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = addFundsSchema.parse(rawData);
    const finalIdempotencyKey = data.idempotencyKey || randomUUID();
    const transactionUuid = randomUUID();
    await db.transaction(async (trx) => {
      const walletCheck = await trx`SELECT id FROM wallets WHERE currency = ${data.currency} AND user_id = ${Number(session.userId)}`;
      if (walletCheck.length === 0) throw new Error(`Wallet ${data.currency} not found.`);
      await trx`UPDATE wallets SET balance = balance + ${data.amount} WHERE currency = ${data.currency} AND user_id = ${Number(session.userId)}`;
      await trx`INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id) VALUES ('Wallet Top-up', 'in', ${data.amount}, 'Completed', 'ACH Transfer', ${data.currency}, ${finalIdempotencyKey}, ${transactionUuid}, NOW(), ${Number(session.userId)})`;
    });
    return { success: true, message: `Successfully added ${data.amount} ${data.currency} to your wallet.` };
  } catch (error: any) {
    if (error.code === "23505" || error.message?.includes("unique constraint")) return { success: true, message: "Top-up already processed.", idempotent: true };
    console.error("Add funds error:", error);
    return { success: false, message: error.message || "Failed to add funds." };
  }
}

export async function createPaymentLink(data: {
  amount: number;
  currency: string;
  description?: string;
}) {
  try {
    const session = await verifySession();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // FIXED: Removed 'uuid' and explicitly cast userId to Number
    const result = await db.execute(
      `INSERT INTO payment_links (amount, currency, status, description, created_at, user_id) 
       VALUES ($1, $2, 'Active', $3, NOW(), $4) 
       RETURNING id, amount, currency, status, description, created_at`,
      [
        data.amount, 
        data.currency, 
        data.description?.trim() || "Payment Request", 
        Number(session.userId)
      ]
    );

    const newLink = result.rows[0] as any;

    return {
      success: true,
      link: {
        id: Number(newLink.id),
        amount: Number(newLink.amount),
        currency: newLink.currency,
        status: newLink.status,
        description: newLink.description,
        created_at: newLink.created_at,
      },
    };
  } catch (error: any) {
    console.error("Create payment link error:", error);
    return { success: false, message: error.message || "Failed to create payment link" };
  }
}

export async function closeWallet(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = closeWalletSchema.parse(rawData);
    const wallet = await db.execute("SELECT balance FROM wallets WHERE currency = $1 AND user_id = $2", [data.currency, Number(session.userId)]);
    if (wallet.rows.length === 0) return { success: false, message: `Wallet ${data.currency} not found.` };
    const balance = Number(wallet.rows[0].balance);
    if (balance > 0) {
      const rates = await getLiveUsdRates();
      const convertedAmount = safeMultiply(balance, safeDivide(rates[data.targetCurrency] || 1, rates[data.currency] || 1));
      await db.transaction(async (trx) => {
        await trx`UPDATE wallets SET balance = balance + ${convertedAmount} WHERE currency = ${data.targetCurrency} AND user_id = ${Number(session.userId)}`;
        await trx`INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id) VALUES ('Close ${data.currency} Wallet', 'out', ${balance}, 'Completed', 'Internal FX', ${data.currency}, ${randomUUID()}, ${randomUUID()}, NOW(), ${Number(session.userId)})`;
      });
    }
    await db.execute("DELETE FROM wallets WHERE currency = $1 AND user_id = $2", [data.currency, Number(session.userId)]);
    return { success: true, message: `Successfully closed ${data.currency} wallet.` };
  } catch (error: any) {
    console.error("Close wallet error:", error);
    return { success: false, message: error.message || "Failed to close wallet." };
  }
}

// ─── PUBLIC CHECKOUT: PAY PAYMENT LINK ───────────────────────

export async function payPaymentLink(rawData: unknown) {
  try {
    const data = rawData as any;
    if (!data.linkId || !data.payerName || !data.method || !data.idempotencyKey) return { success: false, message: "Missing required payment data." };
    const linkId = Number(data.linkId);
    if (!Number.isInteger(linkId) || linkId <= 0) return { success: false, message: "Invalid payment link." };

    const linkResult = await db.execute("SELECT id, user_id, amount, currency, status FROM payment_links WHERE id = $1", [linkId]);
    if (linkResult.rows.length === 0) return { success: false, message: "Payment link not found." };
    const link = linkResult.rows[0] as any;
    if (link.status !== "Active") return { success: false, message: "This payment link is no longer active." };

    const updateResult = await db.execute("UPDATE payment_links SET status = 'Paid' WHERE id = $1 AND status = 'Active' RETURNING id", [linkId]);
    if (updateResult.rows.length === 0) return { success: false, message: "This payment link has already been paid." };

    const transactionUuid = randomUUID();
    await db.transaction(async (trx) => {
      await trx`UPDATE wallets SET balance = balance + ${link.amount} WHERE currency = ${link.currency} AND user_id = ${Number(link.user_id)}`;
      await trx`INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at) VALUES (${Number(link.user_id)}, ${`Payment from ${data.payerName} via ${data.method}`}, 'in', ${link.amount}, 'Completed', ${data.method}, ${link.currency}, ${data.idempotencyKey}, ${transactionUuid}, NOW())`;
    });
    return { success: true, message: "Payment processed successfully." };
  } catch (error: any) {
    if (error.code === "23505" || error.message?.includes("unique constraint")) return { success: true, message: "Payment already processed.", idempotent: true };
    console.error("Pay payment link error:", error);
    return { success: false, message: "Payment failed. Please try again." };
  }
}

// ─── OPENWIC: API KEY & WEBHOOK MANAGEMENT ───────────────────

export async function getApiKeys() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const result = await db.execute("SELECT publishable_key, secret_key FROM api_keys WHERE user_id = $1", [Number(session.userId)]);
    if (result.rows.length === 0) return { success: true, keys: null };
    const row = result.rows[0] as { publishable_key: string; secret_key: string };
    const maskedSecret = row.secret_key.startsWith("sk_live_") ? `sk_live_${"•".repeat(48)}` : `${"•".repeat(56)}`;
    return { success: true, keys: { publishableKey: row.publishable_key, secretKey: maskedSecret } };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve API keys." };
  }
}

export async function regenerateApiKeys() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const publishableKey = generateApiKey("pk_live");
    const secretKey = generateApiKey("sk_live");
    const hashedSecret = await bcrypt.hash(secretKey, 10);
    await db.execute(`INSERT INTO api_keys (user_id, publishable_key, secret_key, regenerated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id) DO UPDATE SET publishable_key = $2, secret_key = $3, regenerated_at = NOW()`, [Number(session.userId), publishableKey, hashedSecret]);
    return { success: true, keys: { publishableKey, secretKey } };
  } catch (error: any) {
    return { success: false, message: "Failed to generate API keys." };
  }
}

export async function getWebhooks() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const result = await db.execute("SELECT id, url, events, secret, is_active, created_at FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC", [Number(session.userId)]);
    const webhooks = result.rows.map((row: any) => ({
      id: row.id, url: row.url, events: (row.events as string).split(","),
      secret: (row.secret as string).startsWith("whsec_") ? `whsec_${"•".repeat(32)}` : `${"•".repeat(40)}`,
      isActive: row.is_active === 1, createdAt: row.created_at,
    }));
    return { success: true, webhooks };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve webhooks." };
  }
}

export async function createWebhook(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    if (!data.url || !data.events || !Array.isArray(data.events)) return { success: false, message: "Invalid webhook data." };
    const webhookSecret = generateApiKey("whsec");
    const hashedSecret = await bcrypt.hash(webhookSecret, 10);
    const result = await db.execute(`INSERT INTO webhooks (user_id, url, events, secret, is_active) VALUES ($1, $2, $3, $4, 1) RETURNING id, url, events, secret, is_active, created_at`, [Number(session.userId), data.url, data.events.join(","), hashedSecret]);
    const row = result.rows[0] as any;
    return { success: true, webhook: { id: row.id, url: row.url, events: (row.events as string).split(","), secret: webhookSecret, isActive: row.is_active === 1, createdAt: row.created_at } };
  } catch (error: any) {
    return { success: false, message: "Failed to create webhook." };
  }
}

export async function deleteWebhook(id: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    await db.execute("DELETE FROM webhooks WHERE id = $1 AND user_id = $2", [id, Number(session.userId)]);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: "Failed to delete webhook." };
  }
}

// ─── SETTINGS & PROFILE ──────────────────────────────────────

export async function updateProfile(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    if (!data.name || !data.name.trim()) return { success: false, message: "Name is required." };
    await db.execute("UPDATE users SET name = $1, company = $2 WHERE id = $3", [data.name.trim(), data.company?.trim() || null, Number(session.userId)]);
    return { success: true, message: "Profile updated." };
  } catch (error: any) {
    return { success: false, message: "Failed to update profile." };
  }
}

export async function changePassword(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    const result = await db.execute("SELECT password_hash FROM users WHERE id = $1", [Number(session.userId)]);
    if (result.rows.length === 0) return { success: false, message: "User not found." };
    if (!(await verifyPassword(data.currentPassword, (result.rows[0] as any).password_hash))) return { success: false, message: "Current password is incorrect." };
    if (!validatePassword(data.newPassword)) return { success: false, message: "Password must be 8+ chars with upper, lower, number, and special char." };
    await db.execute("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(data.newPassword), Number(session.userId)]);
    return { success: true, message: "Password updated successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to change password." };
  }
}

export async function uploadAvatar(file: File) {
  return { success: true, message: "Avatar upload stub.", url: "" };
}

export async function removeAvatar() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    await db.execute("UPDATE users SET avatar_url = '' WHERE id = $1", [Number(session.userId)]);
    return { success: true, message: "Avatar removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to remove avatar." };
  }
}

export async function toggleWalletVisibility(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    await db.execute("UPDATE wallets SET is_active = $1 WHERE currency = $2 AND user_id = $3", [data.isActive ? 1 : 0, data.currency, Number(session.userId)]);
    return { success: true, message: `Wallet ${data.currency} visibility updated` };
  } catch (error: any) {
    return { success: false, message: "Failed to update wallet." };
  }
}

export async function addPaymentMethod(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    await db.execute("INSERT INTO payment_methods (type, name, details, is_default, user_id) VALUES ($1, $2, $3, 0, $4)", [data.type, data.name, data.details, Number(session.userId)]);
    return { success: true, message: "Payment method added successfully" };
  } catch (error: any) {
    return { success: false, message: "Failed to add payment method." };
  }
}

export async function deletePaymentMethod(id: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    await db.execute("DELETE FROM payment_methods WHERE id = $1 AND user_id = $2", [id, Number(session.userId)]);
    return { success: true, message: "Payment method deleted successfully" };
  } catch (error: any) {
    return { success: false, message: "Failed to delete payment method." };
  }
}

// ─── WIRE-ROLL MANAGEMENT ────────────────────────────────────

export async function createWireRoll(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = wireRollSchema.parse(rawData);
    const isBatch = !!(data.items && data.items.length > 0);
    const rollId = await db.transaction(async (trx) => {
      const res = await trx`INSERT INTO wire_rolls (user_id, name, recipient, currency, amount, frequency, next_run_date, rail, status, auto_run) VALUES (${Number(session.userId)}, ${data.name}, ${data.recipient || 'Batch'}, ${data.currency || 'USD'}, ${data.amount || 0}, ${data.frequency}, ${data.nextRunDate}, ${data.rail || 'Auto'}, 'active', 0) RETURNING id`;
      const newRollId = Number(res[0].id);
      if (isBatch && data.items) {
        for (const item of data.items) {
          await trx`INSERT INTO wire_roll_items (roll_id, recipient, currency, amount, rail) VALUES (${newRollId}, ${item.recipient}, ${item.currency}, ${item.amount}, ${item.rail})`;
        }
      }
      return newRollId;
    });
    return { success: true, message: isBatch ? `Wire-roll created with ${data.items!.length} items.` : "Wire-roll created.", rollId };
  } catch (error: any) {
    if (error.name === "ZodError") return { success: false, message: "Invalid input data.", details: error.flatten().fieldErrors };
    return { success: false, message: "Failed to create wire-roll." };
  }
}

export async function toggleWireRoll(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    await db.execute("UPDATE wire_rolls SET status = $1 WHERE id = $2 AND user_id = $3", [data.status, data.id, Number(session.userId)]);
    return { success: true, message: data.status === "active" ? "Roll resumed." : "Roll paused." };
  } catch (error: any) {
    return { success: false, message: "Failed to update wire-roll." };
  }
}

export async function deleteWireRoll(id: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    await db.execute("DELETE FROM wire_roll_items WHERE roll_id = $1", [id]);
    await db.execute("DELETE FROM wire_rolls WHERE id = $1 AND user_id = $2", [id, Number(session.userId)]);
    return { success: true, message: "Wire-roll deleted." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete wire-roll." };
  }
}

export async function setWireRollAutoRun(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const data = rawData as any;
    await db.execute("UPDATE wire_rolls SET auto_run = $1 WHERE id = $2 AND user_id = $3", [data.autoRun ? 1 : 0, data.id, Number(session.userId)]);
    return { success: true, message: data.autoRun ? "Auto-run armed." : "Auto-run disabled." };
  } catch (error: any) {
    return { success: false, message: "Failed to update auto-run." };
  }
}

export async function autoFundWireRoll(rollId: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    return { success: true, message: "Auto-fund logic triggered." };
  } catch (error: any) {
    return { success: false, message: "Failed to auto-fund." };
  }
}

export async function executeWireRollRun(rollId: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const rollRes = await db.execute("SELECT id, name, recipient, currency, amount, frequency, next_run_date, rail, status FROM wire_rolls WHERE id = $1 AND user_id = $2", [rollId, Number(session.userId)]);
    if (rollRes.rows.length === 0) return { success: false, message: "Wire-roll not found." };
    const roll = rollRes.rows[0] as any;
    if (roll.status !== 'active') return { success: false, message: "Wire-roll is not active." };

    const itemsRes = await db.execute("SELECT recipient, currency, amount, rail FROM wire_roll_items WHERE roll_id = $1", [rollId]);
    const items = itemsRes.rows as any[];
    const isBatch = items.length > 0;
    const payments = isBatch ? items.map((i: any) => ({ recipient: i.recipient, currency: i.currency, amount: Number(i.amount), rail: i.rail })) : [{ recipient: roll.recipient, currency: roll.currency, amount: Number(roll.amount), rail: roll.rail }];

    await db.transaction(async (trx) => {
      for (const p of payments) {
        const updateResult = await trx`UPDATE wallets SET balance = balance - ${p.amount} WHERE currency = ${p.currency} AND user_id = ${Number(session.userId)} AND is_active = 1 AND balance >= ${p.amount}`;
        if (updateResult.count === 0) throw new Error(`Insufficient balance in ${p.currency} wallet to complete wire-roll.`);
        await trx`INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, transaction_uuid, created_at) VALUES (${Number(session.userId)}, ${`Wire-roll: ${roll.name} to ${p.recipient}`}, 'out', ${p.amount}, 'Completed', ${p.rail}, ${p.currency}, ${randomUUID()}, NOW())`;
      }
      await trx`INSERT INTO wire_roll_runs (user_id, roll_id, amount, status, rail, executed_at) VALUES (${Number(session.userId)}, ${rollId}, ${roll.amount}, 'completed', ${isBatch ? 'Multi-rail Batch' : payments[0].rail}, NOW())`;
    });

    const interval = roll.frequency === 'weekly' ? '7 days' : roll.frequency === 'biweekly' ? '14 days' : '1 month';
    await db.execute(`UPDATE wire_rolls SET next_run_date = CURRENT_DATE + INTERVAL '${interval}' WHERE id = $1`, [rollId]);
    return { success: true, message: "Wire-roll executed successfully." };
  } catch (error: any) {
    if (error.message?.includes("Insufficient balance")) return { success: false, message: error.message };
    return { success: false, message: "Failed to execute wire-roll." };
  }
}

export async function runDueRolls() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized", ran: 0 };
  try {
    const due = await db.execute(`SELECT id FROM wire_rolls WHERE user_id = $1 AND status = 'active' AND auto_run = 1 AND next_run_date <= CURRENT_DATE`, [Number(session.userId)]);
    let ran = 0, failed = 0;
    for (const row of due.rows) {
      const res = await executeWireRollRun(Number((row as any).id));
      if (res.success) ran++; else failed++;
    }
    return { success: true, ran, failed, message: `Processed ${ran} wire-rolls successfully. ${failed > 0 ? `${failed} failed due to insufficient funds.` : ''}` };
  } catch (error: any) {
    return { success: false, message: "Failed to process due wire-rolls.", ran: 0 };
  }
}

// ─── AI DRAFT CONFIRMATION ───────────────────────────────────

export async function confirmAiDraft(uuid: string) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const result = await db.execute("SELECT * FROM ai_drafts WHERE uuid = $1 AND user_id = $2", [uuid, Number(session.userId)]);
    if (result.rows.length === 0) return { success: false, message: "Draft not found or expired." };
    const draft = result.rows[0] as any;
    if (Date.now() > new Date(draft.expires_at).getTime()) {
      await db.execute("DELETE FROM ai_drafts WHERE uuid = $1", [uuid]);
      return { success: false, message: "Draft has expired. Please try again." };
    }
    const payload = JSON.parse(draft.payload);
    let response;
    switch (draft.action_type) {
      case "executePayment": response = await executePayment({ ...payload, idempotencyKey: uuid }); break;
      case "executeConversionAndPayment": response = await executeConversionAndPayment({ ...payload, idempotencyKey: uuid }); break;
      case "addFunds": response = await addFunds({ ...payload, idempotencyKey: uuid }); break;
      case "createPaymentLink": response = await createPaymentLink(payload); break;
      case "createWireRoll": response = await createWireRoll(payload); break;
      default: return { success: false, message: "Unknown draft type." };
    }
    if (response?.success) await db.execute("DELETE FROM ai_drafts WHERE uuid = $1", [uuid]);
    return response;
  } catch (error: any) {
    console.error("Confirm AI draft error:", error);
    return { success: false, message: "Failed to execute draft." };
  }
}

// ─── DATA HISTORY ────────────────────────────────────────────

export async function exportTransactions() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  try {
    const result = await db.execute("SELECT id, name, type, amount, currency, status, rail, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC", [Number(session.userId)]);
    const escape = (v: any) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const header = "ID,Date,Description,Type,Amount,Currency,Status,Rail";
    const rows = result.rows.map((r: any) => {
      const dateStr = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? "");
      return [r.id, dateStr, r.name, r.type, r.amount, r.currency, r.status, r.rail].map(escape).join(",");
    });
    return { success: true, csv: [header, ...rows].join("\n") };
  } catch (error: any) {
    return { success: false, message: "Failed to export data." };
  }
}

export async function importTransactions(file: File) {
  return { success: true, message: "Import functionality is a stub for now." };
}

// ─── UIR: Claim a Wireways Handle ───────────────────────────
export async function claimHandle(handleLocal: string) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(handleLocal);
    if (!isValid) {
      return { success: false, message: "Handle must be 3-20 characters, using only letters, numbers, and underscores." };
    }

    const fullHandle = `${handleLocal.toLowerCase()}@wireways`;

    const existing = await db.execute(
      "SELECT id FROM universal_identities WHERE handle = $1",
      [fullHandle]
    );

    if (existing.rows.length > 0) {
      return { success: false, message: `@${handleLocal} is already taken. Please choose another.` };
    }

    // FIXED: Explicitly cast userId to Number to prevent Postgres type errors
    await db.execute(
      `INSERT INTO universal_identities (user_id, handle, handle_local, handle_domain, is_default) 
       VALUES ($1, $2, $3, 'wireways', 1)`,
      [Number(session.userId), fullHandle, handleLocal.toLowerCase()]
    );

    return { success: true, handle: fullHandle };
  } catch (error: any) {
    console.error("Claim handle error:", error);
    return { success: false, message: error.message || "Failed to claim handle" };
  }
}

// ─── UIR: Resolve a Wireways Handle ─────────────────────────
export async function resolveHandle(handle: string) {
  try {
    if (!handle.toLowerCase().endsWith("@wireways")) {
      return { success: false, message: "Invalid Wireways handle format." };
    }

    const result = await db.execute(
      `SELECT u.id as user_id, u.name, u.company, ui.handle 
       FROM universal_identities ui
       JOIN users u ON ui.user_id = u.id
       WHERE ui.handle = $1`,
      [handle.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return { success: false, message: "Handle not found." };
    }

    const row = result.rows[0] as any;
    return { 
      success: true, 
      user: {
        userId: Number(row.user_id),
        name: row.name,
        company: row.company,
        handle: row.handle
      }
    };
  } catch (error: any) {
    console.error("Resolve handle error:", error);
    return { success: false, message: error.message || "Failed to resolve handle" };
  }
}

// ─── SMART FX: 2-STEP CONVERSION ───────────────────────────

import { requestFXQuote, executeSmartConversion } from "./smart-fx";

export async function requestSmartFXQuote(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    const data = rawData as any;
    if (!data.fromCurrency || !data.toCurrency || !data.amount) {
      return { success: false, message: "Missing conversion details." };
    }
    if (data.fromCurrency === data.toCurrency) {
      return { success: false, message: "Cannot convert to the same currency." };
    }

    const result = await requestFXQuote({
      userId: Number(session.userId),
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      amount: Number(data.amount)
    });

    return result;
  } catch (error) {
    console.error("Request quote error:", error);
    return { success: false, message: "Failed to request quote." };
  }
}

export async function confirmSmartFXConversion(rawData: unknown) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    const data = rawData as any;
    if (!data.quoteId) return { success: false, message: "Missing quote ID." };

    const result = await executeSmartConversion(Number(data.quoteId), Number(session.userId));
    return result;
  } catch (error) {
    console.error("Confirm conversion error:", error);
    return { success: false, message: "Failed to execute conversion." };
  }
}