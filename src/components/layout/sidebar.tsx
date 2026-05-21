"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CreditCard,
  FileClock,
  PackageSearch,
  Settings,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/orders", label: "Pedidos", icon: PackageSearch },
  { href: "/alerts", label: "Alertas 48h", icon: AlertTriangle },
  { href: "/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/tracking", label: "Rastreios", icon: Truck },
  { href: "/logs", label: "Logs", icon: FileClock },
  { href: "/settings", label: "Configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white md:block">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BellRing className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">SAC Monitor</p>
          <p className="mt-1 text-xs text-muted-foreground">VTEX + Pagar.me</p>
        </div>
      </div>

      <nav className="space-y-1 p-3">
        {navigation.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                active && "bg-secondary text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b bg-white px-3 py-2 md:hidden">
      {navigation.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground",
              active && "bg-secondary text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
