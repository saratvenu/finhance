"use client";

import * as React from "react";
import { Input as HeroInput, InputProps } from "@heroui/react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <HeroInput
        ref={ref}
        radius="sm"
        variant="bordered"
        classNames={{
          inputWrapper: cn("h-9 shadow-sm", className),
          input: "text-base md:text-sm placeholder:text-muted-foreground",
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
