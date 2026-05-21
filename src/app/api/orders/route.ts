import { type NextRequest } from "next/server";

import { env } from "@/config/env";
import { apiErrorResponse } from "@/lib/errors";
import { getMockOrders } from "@/lib/mock-data";
import { buildDashboardMetrics, filterOrders, paginateOrders } from "@/lib/order-utils";
import type { OrderFilters } from "@/types/orders";

export const dynamic = "force-dynamic";

function readFilters(request: NextRequest): OrderFilters {
  const params = request.nextUrl.searchParams;

  return {
    query: params.get("query") ?? undefined,
    vtexStatus: params.get("vtexStatus") ?? undefined,
    pagarmeStatus: params.get("pagarmeStatus") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    over48h: params.get("over48h") === "true",
    withoutTracking: params.get("withoutTracking") === "true",
    withError: params.get("withError") === "true",
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
  };
}

async function getOrdersSource() {
  if (env.USE_MOCK_DATA) {
    return getMockOrders();
  }

  const { listOrders } = await import("@/server/repositories/orderRepository");
  return listOrders();
}

export async function GET(request: NextRequest) {
  try {
    const filters = readFilters(request);
    const orders = await getOrdersSource();
    const filtered = filterOrders(orders, filters);
    const paginated = paginateOrders(filtered, filters.page, filters.pageSize);

    return Response.json({
      ...paginated,
      metrics: buildDashboardMetrics(filtered),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
