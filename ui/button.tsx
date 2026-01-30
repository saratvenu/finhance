"use client";

import * as React from "react";
import { Button as HeroUIButton, type ButtonProps } from "@heroui/button";
import { cn } from "@/lib/utils";

/**
 * Build a custom props type:
 *  - Use all ButtonProps except 'variant'
 *  - Re-declare 'variant' to allow HeroUI variants plus some legacy names
 */
export type LegacyVariants = "link" | "destructive" | "outline";
export type HeroVariants = ButtonProps["variant"]; // "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost" | undefined

export interface CustomButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: HeroVariants | LegacyVariants;
  size?: ButtonProps["size"] | "md";
  className?: string;
}

/**
 * Mapping for legacy variant names -> tailwind classes.
 * For HeroUI-native variants we let HeroUI handle styling.
 */
const legacyVariantClass: Record<string, string> = {
  link: "bg-transparent underline text-primary hover:no-underline",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

export const Button = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ variant = "solid", size = "md", className, ...props }, ref) => {
    // If variant is a HeroUI-native variant, pass it through.
    // Otherwise map legacy variant to HeroUI 'solid' to avoid type mismatch, and
    // add extra tailwind classes for the legacy look.
    const isHeroVariant =
      variant === "solid" ||
      variant === "bordered" ||
      variant === "light" ||
      variant === "flat" ||
      variant === "faded" ||
      variant === "shadow" ||
      variant === "ghost" ||
      variant === undefined;

    const heroVariant = (isHeroVariant ? (variant as ButtonProps["variant"]) : "solid") as
      | ButtonProps["variant"]
      | undefined;

    const extraClass = !isHeroVariant ? legacyVariantClass[variant as string] ?? "" : "";

    return (
      <HeroUIButton
        ref={ref}
        variant={heroVariant}
        size={size as ButtonProps["size"]}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          extraClass,
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
