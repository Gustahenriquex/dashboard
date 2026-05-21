export type IntegrationErrorCode =
  | "API_UNAVAILABLE"
  | "INVALID_TOKEN"
  | "TIMEOUT"
  | "ORDER_NOT_FOUND"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export class IntegrationError extends Error {
  code: IntegrationErrorCode;
  status: number;
  provider: string;
  details?: unknown;

  constructor(params: {
    provider: string;
    code: IntegrationErrorCode;
    message: string;
    status?: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "IntegrationError";
    this.provider = params.provider;
    this.code = params.code;
    this.status = params.status ?? 500;
    this.details = params.details;
  }
}

export function normalizeIntegrationError(provider: string, error: unknown) {
  if (error instanceof IntegrationError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new IntegrationError({
      provider,
      code: "TIMEOUT",
      message: `${provider} nao respondeu dentro do tempo limite.`,
      status: 504,
    });
  }

  if (error instanceof Error) {
    return new IntegrationError({
      provider,
      code: "UNKNOWN_ERROR",
      message: error.message,
      status: 500,
    });
  }

  return new IntegrationError({
    provider,
    code: "UNKNOWN_ERROR",
    message: "Erro desconhecido na integracao.",
    status: 500,
    details: error,
  });
}

export function apiErrorResponse(error: unknown) {
  const normalized =
    error instanceof IntegrationError
      ? error
      : new IntegrationError({
          provider: "app",
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Erro interno.",
        });

  return Response.json(
    {
      error: {
        code: normalized.code,
        provider: normalized.provider,
        message: normalized.message,
      },
    },
    { status: normalized.status },
  );
}
