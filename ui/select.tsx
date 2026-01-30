"use client";

import * as React from "react";
import {
  Select as HeroSelect,
  SelectItem,
  SelectProps
} from "@heroui/react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <HeroSelect
        ref={ref}
        radius="sm"
        variant="bordered"
        classNames={{
          trigger: cn("h-9 shadow-sm", className),
          value: "text-base md:text-sm",
        }}
        {...props}
      >
        {children}
      </HeroSelect>
    );
  }
);

Select.displayName = "Select";
export { Select, SelectItem };
