"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncOrders } from "@/hooks/useOrders";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const syncMutation = useSyncOrders();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    router.push(search ? `/orders?query=${encodeURIComponent(search)}` : "/orders");
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pedido, CPF, e-mail ou cliente"
            className="pl-9"
          />
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={() => syncMutation.mutate({})}
          disabled={syncMutation.isPending}
          title="Sincronizar pedidos"
        >
          <RefreshCcw className={syncMutation.isPending ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Sincronizar</span>
        </Button>
      </div>
    </header>
  );
}
