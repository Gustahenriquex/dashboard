import { OrdersTable } from "@/components/orders/OrdersTable";
import type { OrderFilters } from "@/types/orders";

type OrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {};
  const initialFilters: OrderFilters = {
    query: first(params.query),
    vtexStatus: first(params.vtexStatus),
    pagarmeStatus: first(params.pagarmeStatus),
    over48h: first(params.over48h) === "true",
    withoutTracking: first(params.withoutTracking) === "true",
    withError: first(params.withError) === "true",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Fila operacional de pedidos monitorados.</p>
      </div>
      <OrdersTable initialFilters={initialFilters} />
    </div>
  );
}
