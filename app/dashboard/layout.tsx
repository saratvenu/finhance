import React from "react";
import { Suspense } from "react";
import { BarLoader } from "react-spinners";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Dashboard
        </h1>
      </div>

      {/* Suspense boundary for page content */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#00B7DC" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
