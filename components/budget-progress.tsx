"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

// HeroUI
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Progress } from "@heroui/progress";
import { Tooltip } from "@heroui/tooltip";

// Hooks / actions
import useFetch from "@/hooks/use-fetch";
import { updateBudget } from "@/actions/budget";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Budget {
  id: string;
  amount: string;
}

interface Props {
  accountName: string;
  initialBudget: Budget | null;
  currentExpenses: string;
  monthlyAverages: number[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function calculateFallbackBudget(
  values: number[],
  bufferPercent = 10
) {
  if (!values.length) return 0;

  const avg =
    values.reduce((sum, v) => sum + v, 0) / values.length;

  const buffered = avg * (1 + bufferPercent / 100);

  // round to nearest 500
  return Math.round(buffered / 500) * 500;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BudgetProgress({
  accountName,
  initialBudget,
  currentExpenses,
  monthlyAverages,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount ?? ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  /* ------------------------------------------------------------------ */
  /* Numbers                                                            */
  /* ------------------------------------------------------------------ */

  const budgetAmount = Number(initialBudget?.amount ?? 0);
  const expenseAmount = Number(currentExpenses ?? 0);

  const percentUsed =
    budgetAmount > 0
      ? (expenseAmount / budgetAmount) * 100
      : 0;

  const progressColor =
    percentUsed >= 90
      ? "danger"
      : percentUsed >= 75
      ? "warning"
      : "success";

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */

  const handleUpdateBudget = async () => {
    const value = Number(newBudget);

    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(newBudget);
  };

  const handleSmartBudget = async () => {
    if (!monthlyAverages.length) {
      toast.error("Not enough data to calculate smart budget");
      return;
    }

    const smartAmount =
      calculateFallbackBudget(monthlyAverages);

    await updateBudgetFn(String(smartAmount));

    toast.success("Smart budget applied");
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount ?? "");
    setIsEditing(false);
  };

  /* ------------------------------------------------------------------ */
  /* Effects                                                            */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update budget"
      );
    }
  }, [error]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            Monthly Budget ({accountName})
          </h3>

          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) =>
                    setNewBudget(e.target.value)
                  }
                  className="w-32"
                  placeholder="Enter amount"
                  isDisabled={isLoading}
                  autoFocus
                />

                <Button
                  isIconOnly
                  variant="light"
                  onPress={handleUpdateBudget}
                  isDisabled={isLoading}
                >
                  <Check className="h-4 w-4 text-success" />
                </Button>

                <Button
                  isIconOnly
                  variant="light"
                  onPress={handleCancel}
                  isDisabled={isLoading}
                >
                  <X className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {initialBudget
                    ? `₹${expenseAmount.toFixed(
                        2
                      )} of ₹${budgetAmount.toFixed(
                        2
                      )} spent`
                    : "No budget set"}
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => setIsEditing(true)}
                    className="h-6 w-6"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>

                  <Tooltip content="Automatically sets a budget based on your past monthly spending.">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleSmartBudget}
                      className="flex items-center gap-1 px-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-medium">Smart budget</span>
                    </Button>
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="space-y-2">
          <Progress
            value={Math.min(percentUsed, 100)}
            color={progressColor}
          />
          <p className="text-xs text-muted-foreground text-right">
            {percentUsed.toFixed(1)}% used
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
