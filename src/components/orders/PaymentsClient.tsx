"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";

import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders, useResyncOrder } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime } from "@/lib/order-utils";

export function PaymentsClient() {
  const ordersQuery = useOrders({ pageSize: 100 });
  const resyncMutation = useResyncOrder();
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Status Pagar.me por pedido monitorado.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status Pagar.me</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Recusa</TableHead>
                <TableHead>Atualizacao</TableHead>
                <TableHead className="text-right">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
              {!ordersQuery.isLoading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Nenhum pagamento encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {!ordersQuery.isLoading
                ? orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/orders/${encodeURIComponent(order.orderId)}`}
                          className="hover:text-primary"
                        >
                          {order.orderId}
                        </Link>
                      </TableCell>
                      <TableCell>{order.clientName}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.pagarmeStatus} />
                      </TableCell>
                      <TableCell>{order.payment?.chargeId ?? "-"}</TableCell>
                      <TableCell>
                        {formatCurrency(order.payment?.amount ?? order.totalValue)}
                      </TableCell>
                      <TableCell className="max-w-72">
                        {order.payment?.refusalReason ?? "-"}
                      </TableCell>
                      <TableCell>{formatDateTime(order.lastSyncedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => resyncMutation.mutate(order.orderId)}
                          disabled={resyncMutation.isPending}
                          title="Consultar pagamento"
                        >
                          <RefreshCcw className={resyncMutation.isPending ? "animate-spin" : ""} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
