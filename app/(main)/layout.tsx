// app/(main)/layout.tsx
import type { ReactNode } from "react";
import { Card, CardBody } from "@heroui/card";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl py-10 px-4">
      <Card shadow="sm" radius="lg">
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
}
