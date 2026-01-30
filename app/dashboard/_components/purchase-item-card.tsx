"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseItem } from "./purchase-items";

interface PurchaseItemCardProps {
  item: PurchaseItem;
  predictedNetWorth: number;
}

const TIER_GLOW: Record<
  PurchaseItem["tier"],
  string
> = {
  base: `
    border-blue-400/40
    hover:shadow-[0_0_25px_3px_rgba(59,130,246,0.35)]
  `,
  mid: `
    border-pink-400/40
    hover:shadow-[0_0_25px_3px_rgba(236,72,153,0.35)]
  `,
  top: `
    border-amber-400/40
    hover:shadow-[0_0_30px_4px_rgba(245,158,11,0.45)]
  `,
};

export default function PurchaseItemCard({
  item,
  predictedNetWorth,
}: PurchaseItemCardProps) {
  const [price, setPrice] = useState(item.defaultPrice);

  // Reset price when card changes
  useEffect(() => {
    setPrice(item.defaultPrice);
  }, [item.id, item.defaultPrice]);

  const quantity =
    price > 0
      ? Math.floor(predictedNetWorth / price)
      : 0;

  return (
    <div
      className={`
        rounded-xl border
        bg-background/50 backdrop-blur
        p-4 space-y-4
        transition-all duration-300
        ${TIER_GLOW[item.tier]}
      `}
    >
      {/* Image */}
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-muted">
        <Image
          src={item.image}
          alt={item.label}
          fill
          className="object-contain p-3"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Title + Tier */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{item.label}</h4>
        <span className="text-xs uppercase text-muted-foreground">
          {item.tier}
        </span>
      </div>

      {/* Price input */}
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) =>
          setPrice(Number(e.target.value))
        }
        className="
          w-full rounded-md border px-2 py-1 text-sm
          bg-background focus:outline-none
          focus:ring-2 focus:ring-cyan-400
        "
      />

      {/* Result */}
      <p className="text-sm">
        You can buy{" "}
        <span className="font-semibold text-cyan-400">
          {quantity}
        </span>
      </p>

      <p className="text-xs text-muted-foreground">
        {formatCurrency(price)} each
      </p>
    </div>
  );
}
