import { apiErrorResponse } from "@/lib/errors";
import { syncOrders } from "@/services/syncService";
import type { SyncOrdersInput } from "@/types/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SyncOrdersInput;
    const result = await syncOrders(body);

    return Response.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
