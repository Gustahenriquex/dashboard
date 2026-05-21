import type { IntegrationProvider } from "@/types/orders";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  provider?: IntegrationProvider;
  action?: string;
  orderId?: string;
  message: string;
  durationMs?: number;
  metadata?: unknown;
}

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.info(JSON.stringify(entry));
}

export const logger = {
  info: (payload: LogPayload) => write("info", payload),
  warn: (payload: LogPayload) => write("warn", payload),
  error: (payload: LogPayload) => write("error", payload),
};
