"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";

import NetWorthSlider from "./networth-slider";
import NetWorthSummary from "./networth-summary";
import PurchasePower from "./purchase-power";
import {
  calculateNetSavings,
  predictNetWorth,
} from "./networth-utils";

interface PredictNetWorthCardProps {
  currentNetWorth: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
}

export default function PredictNetWorthCard({
  currentNetWorth,
  avgMonthlyIncome,
  avgMonthlyExpense,
}: PredictNetWorthCardProps) {
  const [years, setYears] = useState(5);
  const [interestRate, setInterestRate] = useState(0.10);
  const [inflationRate, setInflationRate] = useState(0.05);

  const netMonthlySavings = useMemo(
    () =>
      calculateNetSavings(
        avgMonthlyIncome,
        avgMonthlyExpense
      ),
    [avgMonthlyIncome, avgMonthlyExpense]
  );

  const predictedNetWorth = useMemo(
    () =>
      predictNetWorth(
        currentNetWorth,
        netMonthlySavings,
        years,
        {
          annualInterestRate: interestRate,
          annualInflationRate: inflationRate,
        }
      ),
    [
      currentNetWorth,
      netMonthlySavings,
      years,
      interestRate,
      inflationRate,
    ]
  );

  if (netMonthlySavings <= 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold">
            Predict Your Net Worth
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            Reduce expenses to unlock net worth prediction.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          Predict Your Net Worth
        </h3>
      </CardHeader>

      <CardBody className="space-y-6">
        <NetWorthSlider
          years={years}
          onYearsChange={setYears}
          interestRate={interestRate}
          onInterestChange={setInterestRate}
          inflationRate={inflationRate}
          onInflationChange={setInflationRate}
        />

        <NetWorthSummary
          predictedNetWorth={predictedNetWorth}
          years={years}
          netMonthlySavings={netMonthlySavings}
        />

        <PurchasePower
          predictedNetWorth={predictedNetWorth}
        />
      </CardBody>
    </Card>
  );
}
