"use client";

import { Switch } from "@heroui/switch";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/accounts";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: string | number;
  isDefault: boolean;
}

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const { name, type, balance, id, isDefault } = account;

  const router = useRouter();

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async () => {
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
      router.refresh();
    }
  }, [updatedAccount, router]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  const balanceNumber =
    typeof balance === "string" ? parseFloat(balance) : balance;

  return (
    <Card
      className={`
        relative transition-all duration-300
        border border-border bg-background
        hover:shadow-lg
        ${
          isDefault
            ? "ring-1 ring-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
            : ""
        }
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Link href={`/account/${id}`} className="flex-1">
          <CardTitle className="text-sm font-medium capitalize hover:underline">
            {name}
          </CardTitle>
        </Link>

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            isSelected={isDefault}
            onValueChange={handleDefaultChange}
            isDisabled={updateDefaultLoading}
            aria-label="Set as default account"
          />
        </div>
      </CardHeader>

      <Link href={`/account/${id}`} className="block">
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{balanceNumber.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
