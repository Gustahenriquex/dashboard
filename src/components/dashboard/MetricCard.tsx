import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}

const toneClasses = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  destructive: "bg-red-50 text-red-700",
  info: "bg-cyan-50 text-cyan-800",
};

export function MetricCard({ title, value, icon: Icon, tone = "default" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs uppercase text-muted-foreground">{title}</CardTitle>
        <div
          className={cn("flex size-8 items-center justify-center rounded-md", toneClasses[tone])}
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  );
}
