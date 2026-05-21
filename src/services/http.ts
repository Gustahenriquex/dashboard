import { env } from "@/config/env";
import { IntegrationError } from "@/lib/errors";

interface FetchJsonOptions extends RequestInit {
  provider: string;
  timeoutMs?: number;
}

function getErrorCode(status: number) {
  if (status === 401 || status === 403) {
    return "INVALID_TOKEN" as const;
  }

  if (status === 404) {
    return "ORDER_NOT_FOUND" as const;
  }

  if (status >= 500) {
    return "API_UNAVAILABLE" as const;
  }

  return "UNKNOWN_ERROR" as const;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? env.API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new IntegrationError({
        provider: options.provider,
        code: getErrorCode(response.status),
        status: response.status,
        message:
          payload?.message ??
          payload?.error?.message ??
          `${options.provider} retornou HTTP ${response.status}.`,
        details: payload,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof IntegrationError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new IntegrationError({
        provider: options.provider,
        code: "TIMEOUT",
        status: 504,
        message: `${options.provider} nao respondeu dentro do tempo limite.`,
      });
    }

    throw new IntegrationError({
      provider: options.provider,
      code: "API_UNAVAILABLE",
      status: 503,
      message: error instanceof Error ? error.message : `${options.provider} indisponivel.`,
      details: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}
