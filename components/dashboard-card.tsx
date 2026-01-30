"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";

export function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-4 shadow-sm">
      <CardHeader className="font-semibold text-sm text-default-500">{title}</CardHeader>
      <CardBody>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-default-400 mt-1">{subtitle}</div>}
      </CardBody>
    </Card>
  );
}
