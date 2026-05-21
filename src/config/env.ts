const truthyValues = new Set(["1", "true", "yes", "on"]);

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return truthyValues.has(value.toLowerCase());
}

function readNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  USE_MOCK_DATA: readBoolean(process.env.USE_MOCK_DATA, true),
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
  API_TIMEOUT_MS: readNumber(process.env.API_TIMEOUT_MS, 15_000),
  SYNC_DEFAULT_DAYS: readNumber(process.env.SYNC_DEFAULT_DAYS, 7),
  DATABASE_URL: process.env.DATABASE_URL,
  VTEX_ACCOUNT: process.env.VTEX_ACCOUNT,
  VTEX_ENVIRONMENT: process.env.VTEX_ENVIRONMENT ?? "vtexcommercestable",
  VTEX_APP_KEY: process.env.VTEX_APP_KEY,
  VTEX_APP_TOKEN: process.env.VTEX_APP_TOKEN,
  PAGARME_API_KEY: process.env.PAGARME_API_KEY,
};

export function assertVtexConfig() {
  const missing = [
    ["VTEX_ACCOUNT", env.VTEX_ACCOUNT],
    ["VTEX_ENVIRONMENT", env.VTEX_ENVIRONMENT],
    ["VTEX_APP_KEY", env.VTEX_APP_KEY],
    ["VTEX_APP_TOKEN", env.VTEX_APP_TOKEN],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Configuracao VTEX incompleta: ${missing.join(", ")}`);
  }
}

export function assertPagarmeConfig() {
  if (!env.PAGARME_API_KEY) {
    throw new Error("Configuracao Pagar.me incompleta: PAGARME_API_KEY");
  }
}
