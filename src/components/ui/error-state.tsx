"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Nao foi possivel carregar os dados",
  message = "Verifique a conexao, as variaveis de ambiente ou tente novamente.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-8 text-red-700" />
      <h2 className="mt-3 text-sm font-semibold text-red-950">{title}</h2>
      <p className="mt-1 max-w-xl text-sm text-red-800">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 bg-white"
          onClick={onRetry}
        >
          <RefreshCcw />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
