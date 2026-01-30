"use client";

import { useState } from "react";
import PurchaseItemCard from "./purchase-item-card";
import { PURCHASE_ITEMS } from "./purchase-items";
import type { PurchaseItem } from "./purchase-items";

interface PurchasePowerProps {
  predictedNetWorth: number;
}

function Carousel({
  title,
  items,
  predictedNetWorth,
}: {
  title: string;
  items: PurchaseItem[];
  predictedNetWorth: number;
}) {
  const [index, setIndex] = useState(0);
  const total = items.length;

  const prev = () =>
    setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const next = () =>
    setIndex((i) => (i === total - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-xs text-muted-foreground">
          {index + 1} of {total}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted transition"
        >
          ←
        </button>

        <div className="flex-1">
          <PurchaseItemCard
            item={items[index]}
            predictedNetWorth={predictedNetWorth}
          />
        </div>

        <button
          onClick={next}
          className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted transition"
        >
          →
        </button>
      </div>
    </div>
  );
}

export default function PurchasePower({
  predictedNetWorth,
}: PurchasePowerProps) {
  const cars = PURCHASE_ITEMS.filter(
    (i) => i.category === "car"
  );
  const bikes = PURCHASE_ITEMS.filter(
    (i) => i.category === "bike"
  );
  const realEstate = PURCHASE_ITEMS.filter(
    (i) => i.category === "realestate"
  );

  const essentials = PURCHASE_ITEMS.filter(
    (i) =>
      i.category === "gadget" &&
      ["phone", "laptop", "gold"].includes(
        i.subCategory ?? ""
      )
  );

  return (
    <div className="space-y-10">
      <h3 className="text-sm font-medium">
        What can you buy with this?
      </h3>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Carousel
          title="Cars"
          items={cars}
          predictedNetWorth={predictedNetWorth}
        />
        <Carousel
          title="Bikes"
          items={bikes}
          predictedNetWorth={predictedNetWorth}
        />
        <Carousel
          title="Real Estate"
          items={realEstate}
          predictedNetWorth={predictedNetWorth}
        />
      </div>

      {/* Row 2 */}
      <div className="space-y-4">
        <h4 className="font-semibold">
          Essentials & Investments
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {essentials.map((item) => (
            <PurchaseItemCard
              key={item.id}
              item={item}
              predictedNetWorth={predictedNetWorth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
