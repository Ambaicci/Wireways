// ─── Base Application Error ────────────────────────────────────
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Sanitizes the error for client consumption. 
  // NEVER exposes stack traces, raw queries, or internal causes to the client.
  public toResponse(isProduction: boolean = process.env.NODE_ENV === "production") {
    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };

    if (!isProduction || this.details?.safeForClient) {
      (response.error as any).details                   = this.details;
    }

    return response;
  }
}

// ─── Specific Fintech Errors ───────────────────────────────────

export class DatabaseError extends AppError {
  public readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown; query?: string }) {
    super(
      message,
      500,
      "database_error",
      true,
      process.env.NODE_ENV === "development" ? { query: options?.query } : undefined
    );
    this.cause = options?.cause;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Invalid or expired credentials") {
    super(message, 401, "unauthorized", true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "forbidden", true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(
      message,
      429,
      "rate_limit_exceeded",
      true,
      retryAfter ? { retryAfter, safeForClient: true } : undefined
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", fields?: Record<string, string>) {
    super(
      message,
      400,
      "validation_failed",
      true,
      fields ? { fields, safeForClient: true } : undefined
    );
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = "Insufficient funds for this transaction") {
    super(message, 402, "insufficient_funds", true, { safeForClient: true });
  }
}

export class TransactionError extends AppError {
  constructor(message: string = "Transaction failed") {
    super(message, 500, "transaction_failed", true, { safeForClient: true });
  }
}

// ─── Utility: Global Error Formatter for Next.js API Routes ────
export function formatErrorResponse(error: unknown): { response: Response; log: string } {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof AppError) {
    console.error(`[Operational Error] ${error.code}:`, error.message, error.details);
    
    return {
      response: new Response(JSON.stringify(error.toResponse(isProduction)), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }),
      log: `[${error.statusCode}] ${error.code} - ${error.message}`,
    };
  }

  if (error instanceof Error && error.name === "ZodError") {
    const zodError = error as any;
    const validationError = new ValidationError("Invalid request data", zodError.flatten?.().fieldErrors);
    console.warn("[Validation Error]", validationError.details);
    
    return {
      response: new Response(JSON.stringify(validationError.toResponse(isProduction)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
      log: `[400] validation_failed - ${error.message}`,
    };
  }

  console.error("🚨 UNHANDLED EXCEPTION:", error);
  
  const fallbackError = new (AppError as any)(                
    "An unexpected error occurred. Please try again later.",
    500,
    "internal_server_error",
    false
  );

  return {
    response: new Response(JSON.stringify(fallbackError.toResponse(isProduction)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }),
    log: `[500] internal_server_error - Unhandled exception`,
  };
}