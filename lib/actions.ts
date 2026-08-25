"use server";

import { db } from "./db";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, verifySession } from "./auth";
import { getLiveUsdRates } from "./fx";

function generateUUID(): string {
  return randomUUID();
}

function isDraftExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

interface PaymentData {
  recipient: string;
  amount: number;
  currency: string;
  rail: string;
  idempotencyKey?: string;
}

interface ConversionData {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  recipient: string;
  rail: string;
  idempotencyKey?: string;
}

interface TopUpData {
  currency: string;
  amount: number;
  idempotencyKey?: string;
}

export async function executePayment(data: PaymentData & { idempotencyKey?: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { recipient, amount, currency, rail, idempotencyKey } = data;

  try {
    if (idempotencyKey) {
      const existing = await db.execute(
        "SELECT id FROM transactions WHERE idempotency_key = ? AND user_id = ?",
        [idempotencyKey, userId]
      );
      if (existing.rows.length > 0) {
        return { success: true, message: "Payment already processed (idempotent)", transactionId: existing.rows[0].id };
      }
    }

    const transactionUuid = generateUUID();
    const finalIdempotencyKey = idempotencyKey || generateUUID();

    const walletResult = await db.execute(
      "SELECT balance FROM wallets WHERE currency = ? AND user_id = ?",
      [currency, userId]
    );
    if (walletResult.rows.length === 0) return { success: false, message: `Wallet ${currency} not found` };

    const currentBalance = walletResult.rows[0].balance as number;
    const newBalance = currentBalance - amount;
    if (newBalance < 0) return { success: false, message: `Insufficient balance in ${currency} wallet` };

    await db.execute(`
      INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [recipient, "out", amount, "Completed", rail, currency, finalIdempotencyKey, transactionUuid, new Date().toISOString(), userId]);

    await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newBalance, currency, userId]);

    return { success: true, message: `Successfully sent ${amount} ${currency} to ${recipient}`, transactionId: transactionUuid };
  } catch (error: any) {
    console.error("=== PAYMENT EXECUTION ERROR ===", error.message);
    return { success: false, message: `Failed to execute payment: ${error.message}` };
  }
}

export async function executeConversionAndPayment(data: ConversionData & { idempotencyKey?: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { fromCurrency, toCurrency, amount, recipient, rail, idempotencyKey } = data;

  try {
    if (idempotencyKey) {
      const existing = await db.execute(
        "SELECT id FROM transactions WHERE idempotency_key = ? AND user_id = ?",
        [idempotencyKey, userId]
      );
      if (existing.rows.length > 0) return { success: true, message: "Conversion already processed (idempotent)" };
    }

    const transactionUuid = generateUUID();
    const finalIdempotencyKey = idempotencyKey || generateUUID();

    const rates = await getLiveUsdRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    const convertedAmount = amount * (toRate / fromRate);

    const fromWallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [fromCurrency, userId]);
    if (fromWallet.rows.length === 0) return { success: false, message: `Wallet ${fromCurrency} not found` };
    const newFromBalance = (fromWallet.rows[0].balance as number) - amount;
    if (newFromBalance < 0) return { success: false, message: `Insufficient balance in ${fromCurrency}` };

    const toWallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [toCurrency, userId]);
    if (toWallet.rows.length === 0) return { success: false, message: `Wallet ${toCurrency} not found` };
    const newToBalance = (toWallet.rows[0].balance as number) + convertedAmount;

    await db.execute(`
      INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [`Conversion ${fromCurrency} → ${toCurrency}`, "out", amount, "Completed", "Internal FX", fromCurrency, finalIdempotencyKey, transactionUuid, new Date().toISOString(), userId]);

    await db.execute(`
      INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [`Conversion ${fromCurrency} → ${toCurrency}`, "in", convertedAmount, "Completed", "Internal FX", toCurrency, `${finalIdempotencyKey}-credit`, generateUUID(), new Date().toISOString(), userId]);

    await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newFromBalance, fromCurrency, userId]);
    await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newToBalance, toCurrency, userId]);

    return { success: true, message: `Successfully converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}` };
  } catch (error: any) {
    console.error("=== CONVERSION ERROR ===", error.message);
    return { success: false, message: `Failed to execute conversion: ${error.message}` };
  }
}

export async function addFunds(data: TopUpData & { idempotencyKey?: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { currency, amount, idempotencyKey } = data;

  try {
    if (idempotencyKey) {
      const existing = await db.execute("SELECT id FROM transactions WHERE idempotency_key = ? AND user_id = ?", [idempotencyKey, userId]);
      if (existing.rows.length > 0) return { success: true, message: "Top-up already processed (idempotent)" };
    }

    const transactionUuid = generateUUID();
    const finalIdempotencyKey = idempotencyKey || generateUUID();

    const wallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [currency, userId]);
    if (wallet.rows.length === 0) return { success: false, message: `Wallet ${currency} not found` };

    const newBalance = (wallet.rows[0].balance as number) + amount;

    await db.execute(`
      INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["Wallet Top-up", "in", amount, "Completed", "ACH Transfer", currency, finalIdempotencyKey, transactionUuid, new Date().toISOString(), userId]);

    await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newBalance, currency, userId]);

    return { success: true, message: `Successfully added ${amount} ${currency} to your wallet` };
  } catch (error: any) {
    console.error("=== TOP-UP ERROR ===", error.message);
    return { success: false, message: `Failed to add funds: ${error.message}` };
  }
}

export async function createExpiringDraft(actionType: string, payload: any, ttlSeconds: number = 60) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  try {
    const draftUuid = generateUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    await db.execute(`
      INSERT INTO pending_drafts (draft_uuid, action_type, payload, expires_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `, [draftUuid, actionType, JSON.stringify(payload), expiresAt, userId]);

    return { success: true, draftUuid, expiresAt };
  } catch (error: any) {
    console.error("Draft creation error:", error.message);
    return { success: false, message: "Failed to create draft" };
  }
}

export async function validateDraft(draftUuid: string) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  try {
    const result = await db.execute("SELECT * FROM pending_drafts WHERE draft_uuid = ? AND user_id = ?", [draftUuid, userId]);
    if (result.rows.length === 0) return { success: false, message: "Draft not found" };

    const draft = result.rows[0];
    if (isDraftExpired(draft.expires_at as string)) {
      await db.execute("DELETE FROM pending_drafts WHERE draft_uuid = ?", [draftUuid]);
      return { success: false, message: "Draft has expired" };
    }

    return { success: true, draft: { uuid: draft.draft_uuid, actionType: draft.action_type, payload: JSON.parse(draft.payload as string), expiresAt: draft.expires_at } };
  } catch (error: any) {
    console.error("Draft validation error:", error.message);
    return { success: false, message: "Failed to validate draft" };
  }
}

// ==========================================
// PAYMENT METHODS
// ==========================================

export async function addPaymentMethod(data: { type: string; name: string; details: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { type, name, details } = data;
  try {
    await db.execute({
      sql: "INSERT INTO payment_methods (type, name, details, is_default, user_id) VALUES (?, ?, ?, 0, ?)",
      args: [type, name, details, userId]
    });
    return { success: true, message: "Payment method added successfully" };
  } catch (error: any) {
    console.error("=== ADD PAYMENT METHOD ERROR ===", error.message);
    return { success: false, message: `Failed to add payment method: ${error.message}` };
  }
}

export async function deletePaymentMethod(id: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  try {
    await db.execute({ sql: "DELETE FROM payment_methods WHERE id = ? AND user_id = ?", args: [id, userId] });
    return { success: true, message: "Payment method deleted successfully" };
  } catch (error: any) {
    console.error("=== DELETE PAYMENT METHOD ERROR ===", error.message);
    return { success: false, message: `Failed to delete payment method: ${error.message}` };
  }
}

// ==========================================
// WALLET MANAGEMENT
// ==========================================

export async function toggleWalletVisibility(data: { currency: string; isActive: boolean }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { currency, isActive } = data;
  try {
    await db.execute({
      sql: "UPDATE wallets SET is_active = ? WHERE currency = ? AND user_id = ?",
      args: [isActive ? 1 : 0, currency, userId]
    });
    return { success: true, message: `Wallet ${currency} visibility updated` };
  } catch (error: any) {
    console.error("=== TOGGLE WALLET VISIBILITY ERROR ===", error.message);
    return { success: false, message: `Failed to update wallet visibility: ${error.message}` };
  }
}

// ==========================================
// PAYMENT LINKS
// ==========================================

export async function createPaymentLink(data: { amount: number; currency: string; description: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { amount, currency, description } = data;
  try {
    await db.execute({
      sql: "INSERT INTO payment_links (amount, currency, status, description, created_at, user_id) VALUES (?, ?, 'Active', ?, ?, ?)",
      args: [amount, currency, description, new Date().toISOString(), userId]
    });
    return { success: true, message: "Payment link created successfully" };
  } catch (error: any) {
    console.error("=== CREATE PAYMENT LINK ERROR ===", error.message);
    return { success: false, message: `Failed to create payment link: ${error.message}` };
  }
}

// ==========================================
// CLOSE WALLET
// ==========================================

export async function closeWallet(data: { currency: string; targetCurrency: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { currency, targetCurrency } = data;
  try {
    const wallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [currency, userId]);
    if (wallet.rows.length === 0) return { success: false, message: `Wallet ${currency} not found` };
    const balance = wallet.rows[0].balance as number;

    if (balance > 0) {
      const rates = await getLiveUsdRates();
      const fromRate = rates[currency] || 1;
      const toRate = rates[targetCurrency] || 1;
      const convertedAmount = balance * (toRate / fromRate);

      const targetWallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [targetCurrency, userId]);
      if (targetWallet.rows.length === 0) return { success: false, message: `Target wallet ${targetCurrency} not found` };
      const newTargetBalance = (targetWallet.rows[0].balance as number) + convertedAmount;
      await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newTargetBalance, targetCurrency, userId]);

      await db.execute(`
        INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [`Close ${currency} Wallet`, "out", balance, "Completed", "Internal FX", currency, generateUUID(), generateUUID(), new Date().toISOString(), userId]);
    }

    await db.execute("DELETE FROM wallets WHERE currency = ? AND user_id = ?", [currency, userId]);
    return { success: true, message: `Successfully closed ${currency} wallet and converted funds to ${targetCurrency}` };
  } catch (error: any) {
    console.error("=== CLOSE WALLET ERROR ===", error.message);
    return { success: false, message: `Failed to close wallet: ${error.message}` };
  }
}

// ==========================================
// PUBLIC PAYMENT LINKS
// ==========================================

export async function payPaymentLink(data: { linkId: number; payerName: string; method: string }) {
  const { linkId, payerName, method } = data;
  try {
    const linkResult = await db.execute("SELECT * FROM payment_links WHERE id = ?", [linkId]);
    if (linkResult.rows.length === 0) return { success: false, message: "Payment link not found." };

    const link = linkResult.rows[0] as { amount: number; currency: string; status: string; description: string; user_id: number };
    if (link.status !== "Active") return { success: false, message: "This payment link is no longer active." };
    const merchantUserId = link.user_id;

    await db.execute("UPDATE payment_links SET status = 'Paid' WHERE id = ?", [linkId]);

    const wallet = await db.execute("SELECT balance FROM wallets WHERE currency = ? AND user_id = ?", [link.currency, merchantUserId]);
    if (wallet.rows.length > 0) {
      const newBalance = (wallet.rows[0].balance as number) + link.amount;
      await db.execute("UPDATE wallets SET balance = ? WHERE currency = ? AND user_id = ?", [newBalance, link.currency, merchantUserId]);
    }

    await db.execute(`
      INSERT INTO transactions (name, type, amount, status, rail, currency, idempotency_key, transaction_uuid, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [payerName || "Customer", "in", link.amount, "Completed", method, link.currency, generateUUID(), generateUUID(), new Date().toISOString(), merchantUserId]);

    return { success: true, message: "Payment successful!" };
  } catch (error: any) {
    console.error("=== PUBLIC PAYMENT ERROR ===", error.message);
    return { success: false, message: `Payment failed: ${error.message}` };
  }
}

// ==========================================
// AUTHENTICATION
// ==========================================

export async function registerUser(data: { name: string; email: string; password: string; accountType: "personal" | "business"; company?: string }) {
  try {
    const { name, email, password, accountType, company } = data;
    if (!name || !email || !password) return { success: false, message: "All fields are required." };

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPolicy.test(password)) {
      return { success: false, message: "Password must be 8+ characters with an uppercase letter, a lowercase letter, and a number." };
    }

    const existing = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.rows.length > 0) return { success: false, message: "An account with this email already exists." };

    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute(
      "INSERT INTO users (name, email, password_hash, account_type, company) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, accountType, company || null]
    );
    const userId = Number(result.lastInsertRowid);

    const defaultWallets = [
      { currency: "USD", balance: 0, bank: "Wireways US", details: "9876 5432 10" },
      { currency: "EUR", balance: 0, bank: "Wireways EU", details: "1234 5678 90" },
      { currency: "GBP", balance: 0, bank: "Wireways UK", details: "0987 6543 21" },
      { currency: "USDC", balance: 0, bank: "Wireways Crypto", details: "0xAbC...123" },
      { currency: "KES", balance: 0, bank: "Wireways Kenya", details: "712 345 678" },
    ];

    for (const w of defaultWallets) {
      await db.execute(
        "INSERT INTO wallets (currency, balance, bank, details, is_active, user_id) VALUES (?, ?, ?, ?, 1, ?)",
        [w.currency, w.balance, w.bank, w.details, userId]
      );
    }

    await createSession(userId);
    return { success: true, message: "Account created!" };
  } catch (error: any) {
    console.error("Register error:", error);
    return { success: false, message: "Failed to create account." };
  }
}

export async function loginUser(data: { email: string; password: string }) {
  try {
    const { email, password } = data;
    const result = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (result.rows.length === 0) return { success: false, message: "Invalid email or password." };

    const user = result.rows[0] as any;
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return { success: false, message: "Invalid email or password." };

    await createSession(user.id);
    return { success: true, message: "Logged in!" };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, message: "Failed to log in." };
  }
}

export async function logoutUser() {
  await deleteSession();
  return { success: true, message: "Logged out!" };
}

// ==========================================
// SETTINGS: PROFILE, SECURITY & API KEYS
// ==========================================

export async function updateProfile(data: { name: string; company: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { name, company } = data;
  if (!name.trim()) return { success: false, message: "Name is required." };

  try {
    await db.execute("UPDATE users SET name = ?, company = ? WHERE id = ?", [name.trim(), company.trim(), userId]);
    return { success: true, message: "Profile updated." };
  } catch (error: any) {
    return { success: false, message: `Failed to update profile: ${error.message}` };
  }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { currentPassword, newPassword } = data;

  const result = await db.execute("SELECT password_hash FROM users WHERE id = ?", [userId]);
  if (result.rows.length === 0) return { success: false, message: "User not found." };

  const user = result.rows[0] as any;
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) return { success: false, message: "Current password is incorrect." };

  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPolicy.test(newPassword)) {
    return { success: false, message: "New password must be 8+ characters with an uppercase letter, a lowercase letter, and a number." };
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
  return { success: true, message: "Password updated successfully." };
}

function generateKey(prefix: string): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

async function ensureApiKeysTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      publishable_key TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      regenerated_at TEXT
    )
  `);
}

export async function getApiKeys() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  await ensureApiKeysTable();
  const result = await db.execute(
    "SELECT publishable_key, secret_key, created_at, regenerated_at FROM api_keys WHERE user_id = ?",
    [userId]
  );
  if (result.rows.length === 0) return { success: true, keys: null };
  const row = result.rows[0] as any;
  return {
    success: true,
    keys: {
      publishableKey: row.publishable_key,
      secretKey: row.secret_key,
      createdAt: row.created_at,
      regeneratedAt: row.regenerated_at,
    },
  };
}

export async function regenerateApiKeys() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  await ensureApiKeysTable();
  const pk = generateKey("pk_live");
  const sk = generateKey("sk_live");
  const now = new Date().toISOString();

  const existing = await db.execute("SELECT id FROM api_keys WHERE user_id = ?", [userId]);
  if (existing.rows.length === 0) {
    await db.execute(
      "INSERT INTO api_keys (user_id, publishable_key, secret_key, created_at) VALUES (?, ?, ?, ?)",
      [userId, pk, sk, now]
    );
    return { success: true, message: "API keys created.", keys: { publishableKey: pk, secretKey: sk } };
  }
  await db.execute(
    "UPDATE api_keys SET publishable_key = ?, secret_key = ?, regenerated_at = ? WHERE user_id = ?",
    [pk, sk, now, userId]
  );
  return { success: true, message: "API keys regenerated. Old keys are now invalid.", keys: { publishableKey: pk, secretKey: sk } };
}

// ==========================================
// SEND MONEY WIZARD
// ==========================================

export async function executeSend(data: { sourceCurrency: string; amount: number; recipientName: string; rail: string; }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const { sourceCurrency, amount, recipientName, rail } = data;
  if (amount <= 0) return { success: false, message: "Amount must be greater than zero." };
  if (!recipientName.trim()) return { success: false, message: "Recipient name is required." };

  try {
    const walletRes = await db.execute(
      "SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ? AND is_active = 1",
      [userId, sourceCurrency]
    );
    if (walletRes.rows.length === 0) return { success: false, message: "Wallet not found." };
    const wallet = walletRes.rows[0] as any;
    if (wallet.balance < amount) return { success: false, message: `Insufficient ${sourceCurrency} balance.` };

    await db.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", [amount, wallet.id]);
    await db.execute(
      "INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, created_at) VALUES (?, ?, 'out', ?, 'Completed', ?, ?, CURRENT_TIMESTAMP)",
      [userId, recipientName.trim(), amount, rail, sourceCurrency]
    );

    return { success: true, message: `Successfully sent ${amount} ${sourceCurrency} via ${rail}.` };
  } catch (error: any) {
    return { success: false, message: "Transaction failed: " + error.message };
  }
}

// ==========================================
// WIRE-ROLL (recurring payments — batch-aware)
// ==========================================

export async function createWireRoll(data: {
  name: string;
  recipient: string;
  currency: string;
  amount: number;
  frequency: string;
  nextRunDate: string;
  rail: string;
  items?: { recipient: string; currency: string; amount: number; rail: string }[];
}) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const wrUsd: Record<string, number> = { USD: 1, EUR: 1.09, GBP: 1.27, USDC: 1, KES: 0.0077 };
  const { name, frequency, nextRunDate } = data;
  const items = data.items || [];
  const isBatch = items.length > 0;

  if (!name.trim()) return { success: false, message: "Name is required." };
  if (!nextRunDate) return { success: false, message: "Next run date is required." };
  if (!isBatch && (!data.recipient.trim() || data.amount <= 0))
    return { success: false, message: "Recipient and amount are required." };
  if (isBatch && items.some((i) => !i.recipient.trim() || i.amount <= 0))
    return { success: false, message: "Every line item needs a recipient and a positive amount." };

  const recipient = isBatch ? `${items.length} recipients (batch)` : data.recipient.trim();
  const currency = isBatch ? "USD" : data.currency;
  const amount = isBatch
    ? Math.round(items.reduce((s, i) => s + i.amount * (wrUsd[i.currency] || 1), 0))
    : data.amount;
  const rail = isBatch ? "Multi-rail" : data.rail;

  await db.execute(
    "INSERT INTO wire_rolls (user_id, name, recipient, currency, amount, frequency, next_run_date, rail, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')",
    [userId, name.trim(), recipient, currency, amount, frequency, nextRunDate, rail]
  );

  if (isBatch) {
    const roll = await db.execute("SELECT id FROM wire_rolls WHERE user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
    const rollId = (roll.rows[0] as any).id as number;
    for (const i of items) {
      await db.execute(
        "INSERT INTO wire_roll_items (roll_id, recipient, currency, amount, rail) VALUES (?, ?, ?, ?, ?)",
        [rollId, i.recipient.trim(), i.currency, i.amount, i.rail]
      );
    }
  }

  return { success: true, message: isBatch ? `Wire-roll created with ${items.length} line items.` : "Wire-roll created." };
}

export async function toggleWireRoll(data: { id: number; status: string }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  await db.execute("UPDATE wire_rolls SET status = ? WHERE id = ? AND user_id = ?", [data.status, data.id, session.userId]);
  return { success: true, message: data.status === "active" ? "Roll resumed." : "Roll paused." };
}

export async function deleteWireRoll(id: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  await db.execute("DELETE FROM wire_roll_items WHERE roll_id = ?", [id]);
  await db.execute("DELETE FROM wire_rolls WHERE id = ? AND user_id = ?", [id, session.userId]);
  return { success: true, message: "Wire-roll deleted." };
}

export async function executeWireRollRun(rollId: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const rollRes = await db.execute("SELECT * FROM wire_rolls WHERE id = ? AND user_id = ?", [rollId, userId]);
  if (rollRes.rows.length === 0) return { success: false, message: "Roll not found." };
  const roll = rollRes.rows[0] as any;

  const itemsRes = await db.execute("SELECT * FROM wire_roll_items WHERE roll_id = ?", [rollId]);
  const items = itemsRes.rows as any[];

  const payments = items.length > 0
    ? items.map((i) => ({ recipient: i.recipient as string, currency: i.currency as string, amount: i.amount as number, rail: i.rail as string }))
    : [{ recipient: roll.recipient as string, currency: roll.currency as string, amount: roll.amount as number, rail: roll.rail as string }];

  const need: Record<string, number> = {};
  for (const p of payments) need[p.currency] = (need[p.currency] || 0) + p.amount;

  const gaps: string[] = [];
  const wallets: Record<string, number> = {};
  for (const cur of Object.keys(need)) {
    const w = await db.execute("SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ? AND is_active = 1", [userId, cur]);
    if (w.rows.length === 0) { gaps.push(`${cur}: wallet missing`); continue; }
    const wallet = w.rows[0] as any;
    wallets[cur] = wallet.id;
    if (wallet.balance < need[cur]) gaps.push(`${cur} short ${(need[cur] - wallet.balance).toLocaleString()}`);
  }

  if (gaps.length > 0) {
    await db.execute("INSERT INTO wire_roll_runs (user_id, roll_id, amount, status, rail) VALUES (?, ?, ?, 'failed', ?)", [userId, rollId, roll.amount, "Multi-rail"]);
    return { success: false, message: `Funding gap — ${gaps.join(" · ")}. Use Auto-Fund to cover it.` };
  }

  for (const p of payments) {
    await db.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", [p.amount, wallets[p.currency]]);
    await db.execute("INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, created_at) VALUES (?, ?, 'out', ?, 'Completed', ?, ?, CURRENT_TIMESTAMP)", [userId, p.recipient, p.amount, p.rail, p.currency]);
  }

  await db.execute("INSERT INTO wire_roll_runs (user_id, roll_id, amount, status, rail) VALUES (?, ?, ?, 'completed', ?)", [userId, rollId, roll.amount, payments.length > 1 ? "Multi-rail" : payments[0].rail]);

  const next = new Date(roll.next_run_date);
  if (roll.frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (roll.frequency === "biweekly") next.setDate(next.getDate() + 14);
  else next.setMonth(next.getMonth() + 1);
  await db.execute("UPDATE wire_rolls SET next_run_date = ? WHERE id = ?", [next.toISOString().slice(0, 10), rollId]);

  const curCount = Object.keys(need).length;
  return { success: true, message: `Run completed — ${payments.length} payment${payments.length > 1 ? "s" : ""} across ${curCount} currenc${curCount > 1 ? "ies" : "y"}.` };
}

export async function autoFundWireRoll(rollId: number) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  const userId = session.userId;

  const rollRes = await db.execute("SELECT * FROM wire_rolls WHERE id = ? AND user_id = ?", [rollId, userId]);
  if (rollRes.rows.length === 0) return { success: false, message: "Roll not found." };

  const itemsRes = await db.execute("SELECT * FROM wire_roll_items WHERE roll_id = ?", [rollId]);
  const items = itemsRes.rows as any[];
  const roll = rollRes.rows[0] as any;
  const payments = items.length > 0
    ? items.map((i) => ({ currency: i.currency as string, amount: i.amount as number }))
    : [{ currency: roll.currency as string, amount: roll.amount as number }];

  const need: Record<string, number> = {};
  for (const p of payments) need[p.currency] = (need[p.currency] || 0) + p.amount;

  const funded: string[] = [];
  for (const cur of Object.keys(need)) {
    const w = await db.execute("SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ? AND is_active = 1", [userId, cur]);
    if (w.rows.length === 0) continue;
    const wallet = w.rows[0] as any;
    const gap = need[cur] - wallet.balance;
    if (gap > 0) {
      await db.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", [gap, wallet.id]);
      await db.execute("INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, created_at) VALUES (?, ?, 'in', ?, 'Completed', ?, ?, CURRENT_TIMESTAMP)", [userId, `Auto-Fund (AI) — ${cur} payroll top-up`, gap, "Instant Top-up", cur]);
      funded.push(`${cur} +${gap.toLocaleString()}`);
    }
  }

  if (funded.length === 0) return { success: true, message: "All wallets already funded for this roll." };
  return { success: true, message: `Auto-Fund complete: ${funded.join(" · ")}.` };
}

export async function setWireRollAutoRun(data: { id: number; autoRun: boolean }) {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized" };
  await db.execute("UPDATE wire_rolls SET auto_run = ? WHERE id = ? AND user_id = ?", [data.autoRun ? 1 : 0, data.id, session.userId]);
  return { success: true, message: data.autoRun ? "Auto-run armed — due rolls execute on their own." : "Auto-run disabled." };
}

export async function runDueRolls() {
  const session = await verifySession();
  if (!session) return { success: false, message: "Unauthorized", ran: 0 };
  const userId = session.userId;

  const today = new Date().toISOString().slice(0, 10);
  const due = await db.execute("SELECT id FROM wire_rolls WHERE user_id = ? AND status = 'active' AND auto_run = 1 AND next_run_date <= ?", [userId, today]);

  let ran = 0;
  const messages: string[] = [];
  for (const row of due.rows) {
    const res = await executeWireRollRun((row as any).id);
    if (res.success) { ran++; messages.push(res.message); }
  }
  return { success: true, ran, message: messages.join(" ") || "No due rolls executed." };
}

// ==========================================
// WEBHOOKS (Developer Services)
// ==========================================

function generateWebhookSecret(): string {
  try {
    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return "whsec_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback for older runtimes
    return "whsec_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 26);
  }
}

export async function getWebhooks() {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    const res = await db.execute(
      "SELECT id, url, events, secret, is_active, created_at FROM webhooks WHERE user_id = ? ORDER BY id DESC",
      [session.userId]
    );

    const webhooks = res.rows.map((r: any) => ({
      id: Number(r.id),
      url: r.url as string,
      events: JSON.parse((r.events as string) || "[]"),
      secret: r.secret as string,
      isActive: !!r.is_active,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
    }));

    return { success: true, webhooks };
  } catch (error: any) {
    console.error("Get webhooks error:", error);
    return { success: false, message: "Failed to load webhooks." };
  }
}

export async function createWebhook(data: { url: string; events: string[] }) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    const url = (data.url || "").trim();
    if (!/^https:\/\//i.test(url)) {
      return { success: false, message: "Webhook URL must start with https://" };
    }

    const events = Array.isArray(data.events) && data.events.length > 0
      ? data.events
      : ["payment.completed", "payment.failed", "wallet.topup"];

    const secret = generateWebhookSecret();

    const result = await db.execute(
      "INSERT INTO webhooks (user_id, url, events, secret, is_active) VALUES (?, ?, ?, ?, ?)",
      [session.userId, url, JSON.stringify(events), secret, true]
    );

    return {
      success: true,
      webhook: {
        id: Number(result.lastInsertRowid),
        url,
        events,
        secret,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Create webhook error:", error);
    return { success: false, message: "Failed to create webhook." };
  }
}

export async function deleteWebhook(id: number) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Tenant isolation: a user can only ever delete their own webhook
    await db.execute("DELETE FROM webhooks WHERE id = ? AND user_id = ?", [id, session.userId]);
    return { success: true };
  } catch (error: any) {
    console.error("Delete webhook error:", error);
    return { success: false, message: "Failed to delete webhook." };
  }
}

// ==========================================
// DATA EXPORT (CSV)
// ==========================================

export async function exportTransactions() {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    const res = await db.execute(
      `SELECT id, name, type, amount, currency, status, rail, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
      [session.userId]
    );

    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = "ID,Date,Description,Type,Amount,Currency,Status,Rail";
    const rows = res.rows.map((r: any) => {
      const dateStr = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? "");
      return [r.id, dateStr, r.name, r.type, r.amount, r.currency, r.status, r.rail]
        .map(escape)
        .join(",");
    });

    return { success: true, csv: [header, ...rows].join("\n") };
  } catch (error: any) {
    console.error("Export transactions error:", error);
    return { success: false, message: "Failed to export data." };
  }
}

// ==========================================
// TRANSACTION IMPORT (teach WIC your history)
// ==========================================

export interface ImportRow {
  date: string;      // ISO or parseable date string
  name: string;      // counterparty / description
  amount: number;    // positive = inflow, negative = outflow
}

export async function importTransactions(data: { rows: ImportRow[]; currency: string }) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    const rows = Array.isArray(data.rows) ? data.rows : [];
    if (rows.length === 0) return { success: false, message: "No rows to import." };
    if (rows.length > 2000) return { success: false, message: "Please import 2,000 rows or fewer at a time." };

    const currency = ["USD", "EUR", "GBP", "KES", "USDC"].includes(data.currency) ? data.currency : "USD";

    // Build a de-dupe key from existing transactions so re-imports don't multiply
    const existing = await db.execute(
      "SELECT name, amount, type, created_at FROM transactions WHERE user_id = ?",
      [session.userId]
    );
    const seen = new Set<string>();
    for (const r of existing.rows as any[]) {
      const d = r.created_at instanceof Date ? r.created_at.toISOString().slice(0, 10) : String(r.created_at || "").slice(0, 10);
      seen.add(`${r.name}|${Number(r.amount).toFixed(2)}|${r.type}|${d}`);
    }

    let imported = 0;
    let skipped = 0;

    for (const raw of rows) {
      const name = String(raw.name || "").trim().slice(0, 120);
      const amount = Number(raw.amount);
      const parsed = new Date(raw.date);
      const iso = isNaN(parsed.getTime()) ? null : parsed.toISOString();

      // Skip anything malformed — never poison the ledger
      if (!name || !isFinite(amount) || amount === 0 || !iso) { skipped++; continue; }

      const type = amount < 0 ? "out" : "in";
      const abs = Math.abs(amount);
      const dayKey = iso.slice(0, 10);
      const key = `${name}|${abs.toFixed(2)}|${type}|${dayKey}`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);

      await db.execute(
        `INSERT INTO transactions (user_id, name, type, amount, currency, status, rail, created_at, imported)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [session.userId, name, type, abs, currency, "imported", "Imported", iso]
      );
      imported++;
    }

    return { success: true, imported, skipped };
  } catch (error: any) {
    console.error("Import transactions error:", error);
    return { success: false, message: "Failed to import transactions." };
  }
}

// ==========================================
// AVATAR UPLOAD (resize happens client-side)
// ==========================================

export async function uploadAvatar(dataUrl: string) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    if (!dataUrl || typeof dataUrl !== "string") {
      return { success: false, message: "Invalid image." };
    }
    if (!dataUrl.startsWith("data:image/")) {
      return { success: false, message: "Only image files are allowed." };
    }
    if (dataUrl.length > 400_000) {
      return { success: false, message: "Image too large. Please choose a smaller photo." };
    }

    await db.execute("UPDATE users SET avatar_url = ? WHERE id = ?", [dataUrl, session.userId]);
    return { success: true, avatarUrl: dataUrl };
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    return { success: false, message: "Failed to upload avatar." };
  }
}

export async function removeAvatar() {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: "Unauthorized" };

    await db.execute("UPDATE users SET avatar_url = ? WHERE id = ?", ["", session.userId]);
    return { success: true };
  } catch (error: any) {
    console.error("Remove avatar error:", error);
    return { success: false, message: "Failed to remove avatar." };
  }
}