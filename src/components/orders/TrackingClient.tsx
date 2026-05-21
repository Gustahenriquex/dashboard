"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { TrackingModal } from "@/components/tracking/TrackingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/hooks/useOrders";
import { formatDateTime } from "@/lib/order-utils";

export function TrackingClient() {
  const ordersQuery = useOrders({ pageSize: 100 });
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Rastreios</h1>
        <p className="text-sm text-muted-foreground">
          Codigos e links de entrega retornados pela VTEX.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {ordersQuery.isError ? (
            <div className="p-4">
              <ErrorState
                title="Rastreios indisponiveis"
                message={ordersQuery.error.message}
                onRetry={() => void ordersQuery.refetch()}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Ultima atualizacao</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
                {!ordersQuery.isLoading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Nenhum pedido encontrado.
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
                        <TableCell>{order.carrierName ?? "-"}</TableCell>
                        <TableCell>{order.trackingCode ?? "-"}</TableCell>
                        <TableCell className="max-w-72 truncate">
                          {order.trackingUrl ?? "-"}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.tracking?.lastUpdatedAt ?? order.lastSyncedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <TrackingModal order={order}>
                              <Button type="button" variant="ghost" size="sm">
                                Rastreio
                              </Button>
                            </TrackingModal>
                            {order.trackingUrl ? (
                              <Button asChild variant="ghost" size="icon" title="Abrir rastreio">
                                <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink />
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
