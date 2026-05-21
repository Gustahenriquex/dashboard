import { apiErrorResponse } from "@/lib/errors";
import { getTrackingByOrderId } from "@/services/trackingService";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const tracking = await getTrackingByOrderId(decodeURIComponent(orderId));

    return Response.json({ tracking });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
