import { env, assertPagarmeConfig } from "@/config/env";
import { IntegrationError } from "@/lib/errors";
import { getMockOrderById } from "@/lib/mock-data";
import { fetchJson } from "@/services/http";
import type { PagarmeStatus, PaymentStatusInfo } from "@/types/orders";

interface PagarmeListResponse {
  data?: any[];
}

function getHeaders() {
  assertPagarmeConfig();

  return {
    Authorization: `Basic ${Buffer.from(`${env.PAGARME_API_KEY}:`).toString("base64")}`,
  };
}

function normalizeStatus(status?: string): PagarmeStatus {
  const normalized = status?.toLowerCase();

  if (["paid", "approved", "authorized"].includes(normalized ?? "")) {
    return "approved";
  }

  if (["pending", "processing", "waiting_payment"].includes(normalized ?? "")) {
    return "pending";
  }

  if (["failed", "refused", "rejected"].includes(normalized ?? "")) {
    return "refused";
  }

  if (["canceled", "cancelled"].includes(normalized ?? "")) {
    return "canceled";
  }

  if (["refunded", "chargedback"].includes(normalized ?? "")) {
    return "refunded";
  }

  return normalized ?? "not-found";
}

function mapCharge(orderId: string, rawOrder: any): PaymentStatusInfo {
  const charge = rawOrder?.charges?.[0] ?? rawOrder;
  const transaction = charge?.last_transaction ?? charge?.transactions?.[0] ?? {};
  const amountInCents = charge?.amount ?? rawOrder?.amount;

  return {
    provider: "pagarme",
    status: normalizeStatus(charge?.status ?? rawOrder?.status),
    chargeId: charge?.id ?? null,
    transactionId: transaction?.id ?? rawOrder?.id ?? null,
    refusalReason:
      transaction?.gateway_response?.errors?.[0]?.message ??
      transaction?.acquirer_message ??
      charge?.refusal_reason ??
      null,
    amount: typeof amountInCents === "number" ? amountInCents / 100 : null,
    rawJson: {
      orderId,
      rawOrder,
    },
  };
}

export async function findPaymentByOrderId(orderId: string): Promise<PaymentStatusInfo> {
  if (env.USE_MOCK_DATA) {
    const order = getMockOrderById(orderId);

    if (!order?.payment) {
      return {
        provider: "pagarme",
        status: "not-found",
        amount: null,
      };
    }

    return order.payment;
  }

  const params = new URLSearchParams({
    code: orderId,
  });

  const response = await fetchJson<PagarmeListResponse>(
    `https://api.pagar.me/core/v5/orders?${params}`,
    {
      provider: "pagarme",
      headers: getHeaders(),
    },
  );

  const rawOrder = response.data?.[0];

  if (!rawOrder) {
    throw new IntegrationError({
      provider: "pagarme",
      code: "ORDER_NOT_FOUND",
      status: 404,
      message: `Pagamento do pedido ${orderId} nao encontrado na Pagar.me.`,
    });
  }

  return mapCharge(orderId, rawOrder);
}

export async function getPaymentStatus(orderId: string) {
  const payment = await findPaymentByOrderId(orderId);
  return payment.status;
}

export async function getChargeData(orderId: string) {
  return findPaymentByOrderId(orderId);
}

export function isPaymentApproved(status?: string | null) {
  return status === "approved";
}

export function isPaymentPending(status?: string | null) {
  return status === "pending" || status === "processing";
}

export function isPaymentRefused(status?: string | null) {
  return status === "refused";
}

export function isPaymentCanceled(status?: string | null) {
  return status === "canceled";
}

export function isPaymentRefunded(status?: string | null) {
  return status === "refunded";
}
