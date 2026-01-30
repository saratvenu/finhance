"use client";

import { Progress as HeroProgress } from "@heroui/progress";
import type { ProgressProps as HeroProgressProps } from "@heroui/progress";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProgressProps
  extends Omit<HeroProgressProps, "value"> {
  value?: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function Progress({
  value = 0,
  ...props
}: ProgressProps) {
  return (
    <HeroProgress
      value={Math.min(Math.max(value, 0), 100)}
      radius="none"
      size="sm"
      classNames={{
        base: "w-full",
        track: "bg-white/10",
        indicator:
          "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 " +
          "shadow-[0_0_14px_rgba(34,211,238,0.9)]",
      }}
      {...props}
    />
  );
}
