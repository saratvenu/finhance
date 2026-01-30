"use client";

import Link from "next/link";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Home, BarChart2, Wallet, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function Sidebar() {
  const pathname = usePathname();
  const menu = [
    { name: "Overview", href: "/dashboard", icon: <Home size={18} /> },
    { name: "Analytics", href: "/dashboard/analytics", icon: <BarChart2 size={18} /> },
    { name: "Transactions", href: "/dashboard/transactions", icon: <Wallet size={18} /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ];

  return (
    <Card className="h-full w-64 p-4 bg-content2 shadow-lg border-r border-default-100">
      <div className="text-2xl font-semibold mb-8 text-primary">Finhance</div>
      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button
              fullWidth
              variant={pathname === item.href ? "flat" : "light"}
              startContent={item.icon}
              className={clsx(
                "justify-start text-sm transition-colors",
                pathname === item.href && "bg-primary text-primary-foreground"
              )}
            >
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
    </Card>
  );
}
