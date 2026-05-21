import { OrderDetailsClient } from "@/components/orders/OrderDetailsClient";

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  return <OrderDetailsClient orderId={decodeURIComponent(orderId)} />;
}
