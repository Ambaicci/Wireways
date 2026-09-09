import { db } from "./db";
import { getLiveUsdRates } from "./fx";
import { safeMultiply, safeDivide } from "./validations";
import { commitJournal } from "./ledger";
import { getWICMessage } from "./wic-translator";

const SLIPPAGE_TOLERANCE = 0.005; // 0.5% max movement allowed
const QUOTE_DURATION_MS = 60 * 1000; // 60 seconds

export interface QuoteRequest {
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface QuoteResult {
  success: boolean;
  quoteId?: number;
  lockedRate?: number;
  convertedAmount?: number;
  message?: any; // WIC Message object
}

/**
 * Step 1: Request a Quote (Locks the rate)
 */
export async function requestFXQuote(data: QuoteRequest): Promise<QuoteResult> {
  try {
    const rates = await getLiveUsdRates();
    const lockedRate = safeDivide(rates[data.toCurrency] || 1, rates[data.fromCurrency] || 1);
    const convertedAmount = safeMultiply(data.amount, lockedRate);
    const expiresAt = new Date(Date.now() + QUOTE_DURATION_MS);

    const result = await db.execute(
      `INSERT INTO fx_quotes (user_id, from_currency, to_currency, amount, locked_rate, converted_amount, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id`,
      [data.userId, data.fromCurrency, data.toCurrency, data.amount, lockedRate, convertedAmount, expiresAt.toISOString()]
    );

    const quoteId = Number((result.rows[0] as any).id);

    return {
      success: true,
      quoteId,
      lockedRate,
      convertedAmount,
      message: getWICMessage("QUOTE_CREATED")
    };
  } catch (error) {
    console.error("Quote request failed:", error);
    return { success: false, message: { headline: "Failed to get quote", body: "Please try again.", tone: "error" } };
  }
}

/**
 * Step 2: Execute the Conversion (Checks for slippage)
 */
export async function executeSmartConversion(quoteId: number, userId: number): Promise<any> {
  try {
    // 1. Fetch the locked quote
    const quoteRes = await db.execute(
      `SELECT * FROM fx_quotes WHERE id = $1 AND user_id = $2`,
      [quoteId, userId]
    );

    if (quoteRes.rows.length === 0) {
      return { success: false, message: getWICMessage("QUOTE_EXPIRED") };
    }

    const quote = quoteRes.rows[0] as any;

    // 2. Check if expired
    if (new Date(quote.expires_at).getTime() < Date.now()) {
      await db.execute(`UPDATE fx_quotes SET status = 'expired' WHERE id = $1`, [quoteId]);
      return { success: false, message: getWICMessage("QUOTE_EXPIRED") };
    }

    // 3. Check for Slippage (Compare locked rate to current live rate)
    const rates = await getLiveUsdRates();
    const currentLiveRate = safeDivide(rates[quote.to_currency] || 1, rates[quote.from_currency] || 1);
    const rateDifference = Math.abs(currentLiveRate - Number(quote.locked_rate)) / Number(quote.locked_rate);

    if (rateDifference > SLIPPAGE_TOLERANCE) {
      await db.execute(`UPDATE fx_quotes SET status = 'aborted' WHERE id = $1`, [quoteId]);
      return { success: false, message: getWICMessage("SLIPPAGE_ABORTED") };
    }

    // 4. Find Wallets
    const walletFromRes = await db.execute("SELECT id FROM wallets WHERE currency = $1 AND user_id = $2", [quote.from_currency, userId]);
    const walletToRes = await db.execute("SELECT id FROM wallets WHERE currency = $1 AND user_id = $2", [quote.to_currency, userId]);

    if (walletFromRes.rows.length === 0 || walletToRes.rows.length === 0) {
      return { success: false, message: { headline: "Wallet missing", body: "You need both wallets to convert.", tone: "error" } };
    }

    // 5. Commit to Immutable Ledger
    const journalEntries = [
      { walletId: Number(walletFromRes.rows[0].id), userId, type: "debit" as const, amount: Number(quote.amount), currency: quote.from_currency },
      { walletId: Number(walletToRes.rows[0].id), userId, type: "credit" as const, amount: Number(quote.converted_amount), currency: quote.to_currency }
    ];

    const ledgerResult = await commitJournal(journalEntries, {
      name: `Smart FX: ${quote.from_currency} → ${quote.to_currency}`,
      type: "conversion",
      rail: "Internal FX",
      idempotencyKey: `fx_quote_${quoteId}`
    });

    if (!ledgerResult.success) {
      return { success: false, message: { headline: "Ledger Error", body: ledgerResult.message, tone: "error" } };
    }

    // 6. Mark quote as completed
    await db.execute(`UPDATE fx_quotes SET status = 'completed' WHERE id = $1`, [quoteId]);

    return { 
      success: true, 
      message: getWICMessage("CONVERSION_SUCCESS", { amount: quote.amount, from: quote.from_currency, converted: quote.converted_amount, to: quote.to_currency }) 
    };

  } catch (error) {
    console.error("Smart FX execution failed:", error);
    return { success: false, message: { headline: "System Error", body: "Conversion failed.", tone: "error" } };
  }
}