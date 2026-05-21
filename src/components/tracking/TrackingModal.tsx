"use client";

import * as React from "react";
import { ExternalLink, Loader2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracking } from "@/hooks/useOrders";
import { formatDateTime } from "@/lib/order-utils";
import type { MonitoredOrder, TrackingInfo } from "@/types/orders";

interface TrackingModalProps {
  order: MonitoredOrder;
  children?: React.ReactNode;
}

function mergeTracking(order: MonitoredOrder, tracking?: TrackingInfo): TrackingInfo {
  return {
    carrierName: tracking?.carrierName ?? order.carrierName ?? null,
    trackingCode: tracking?.trackingCode ?? order.trackingCode ?? null,
    trackingUrl: tracking?.trackingUrl ?? order.trackingUrl ?? null,
    lastStatus: tracking?.lastStatus ?? order.tracking?.lastStatus ?? null,
    lastUpdatedAt: tracking?.lastUpdatedAt ?? order.tracking?.lastUpdatedAt ?? order.lastSyncedAt,
    history: tracking?.history ?? order.tracking?.history ?? [],
    iframeAllowed: tracking?.iframeAllowed ?? false,
  };
}

export function TrackingModal({ order, children }: TrackingModalProps) {
  const [open, setOpen] = React.useState(false);
  const trackingQuery = useTracking(open ? order.orderId : null);
  const tracking = mergeTracking(order, trackingQuery.data?.tracking);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" variant="ghost" size="sm">
            <PackageSearch />
            {order.trackingCode ?? "Rastreio"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rastreio do pedido {order.orderId}</DialogTitle>
          <DialogDescription>
            {tracking.trackingCode ?? "Sem codigo"} ·{" "}
            {tracking.carrierName ?? "Transportadora nao informada"}
          </DialogDescription>
        </DialogHeader>

        {trackingQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 overflow-y-auto pr-1">
            <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Codigo</p>
                <p className="mt-1 break-words text-sm font-medium">
                  {tracking.trackingCode ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Transportadora
                </p>
                <p className="mt-1 text-sm font-medium">{tracking.carrierName ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Ultima atualizacao
                </p>
                <p className="mt-1 text-sm font-medium">{formatDateTime(tracking.lastUpdatedAt)}</p>
              </div>
              <div className="flex items-end">
                {tracking.trackingUrl ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={tracking.trackingUrl} target="_blank" rel="noreferrer">
                      <ExternalLink />
                      Abrir site
                    </a>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="w-full" disabled>
                    Sem link
                  </Button>
                )}
              </div>
            </div>

            {tracking.trackingUrl && tracking.iframeAllowed ? (
              <iframe
                title={`Rastreio ${order.orderId}`}
                src={tracking.trackingUrl}
                className="h-80 w-full rounded-lg border bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="rounded-lg border bg-secondary/50 p-4">
                <p className="text-sm font-medium">
                  {tracking.lastStatus ?? "Visualizacao externa disponivel"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tracking.trackingUrl
                    ? "A transportadora pode bloquear iframe; use o botao externo para abrir o rastreio."
                    : "Aguardando codigo ou URL de rastreio na VTEX."}
                </p>
              </div>
            )}

            <div className="rounded-lg border bg-white">
              <div className="border-b px-4 py-3 text-sm font-semibold">Historico</div>
              <div className="divide-y">
                {tracking.history?.length ? (
                  tracking.history.map((event, index) => (
                    <div key={`${event.happenedAt}-${index}`} className="px-4 py-3">
                      <p className="text-sm font-medium">{event.description ?? event.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.happenedAt)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4" />
                    Historico indisponivel
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
