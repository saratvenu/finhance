"use client";

import { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Button,
  Input,
  Switch,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";

import { Calendar } from "@/ui/calendar";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./receipt-scanner";

import type { z } from "zod";

/* -------------------------------------------------------------------------- */

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AccountDTO {
  id: string;
  name: string;
  balance: string;
  isDefault?: boolean;
}

interface CategoryDTO {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface AddTransactionFormProps {
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  editMode?: boolean;
  initialData?: any | null;
}

/* -------------------------------------------------------------------------- */

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}: AddTransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            recurringInterval: initialData.recurringInterval,
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((a) => a.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */

  const mapAiCategoryToId = (aiCategory?: string) =>
    categories.find(
      (c) => c.name.toLowerCase() === aiCategory?.toLowerCase()
    )?.id;

  /* -------------------------------------------------------------------------- */
  /* Submit                                                                     */
  /* -------------------------------------------------------------------------- */

  const onSubmit = handleSubmit((data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
    };

    editMode && editId
      ? transactionFn(editId, payload)
      : transactionFn(payload);
  });

  /* -------------------------------------------------------------------------- */
  /* Receipt Scan Handler                                                       */
  /* -------------------------------------------------------------------------- */

  const handleScanComplete = useCallback(
    (scanned: any) => {
      if (!scanned) return;

      if (typeof scanned.amount === "number" && scanned.amount > 0) {
        setValue("amount", scanned.amount.toString(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (scanned.date) {
        const d = new Date(scanned.date);
        if (!isNaN(d.getTime())) setValue("date", d);
      }

      if (scanned.description) {
        setValue("description", scanned.description);
      }

      const catId = mapAiCategoryToId(scanned.category);
      if (catId) setValue("category", catId);
    },
    [setValue, categories]
  );

  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (transactionResult?.success && transactionResult.data) {
      toast.success(
        editMode ? "Transaction updated" : "Transaction created"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, editMode, reset, router]);

  /* -------------------------------------------------------------------------- */

  const type = watch("type");
  const date = watch("date");
  const isRecurring = watch("isRecurring");

  const filteredCategories = categories.filter((c) => c.type === type);

  /* -------------------------------------------------------------------------- */

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* TYPE */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Select
            label="Type"
            selectedKeys={[field.value]}
            onSelectionChange={(k) =>
              field.onChange(Array.from(k)[0])
            }
          >
            <SelectItem key="EXPENSE" textValue="Expense">
              Expense
            </SelectItem>
            <SelectItem key="INCOME" textValue="Income">
              Income
            </SelectItem>
          </Select>
        )}
      />

      {/* AMOUNT + ACCOUNT */}
      <div className="grid gap-6 md:grid-cols-2">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              errorMessage={errors.amount?.message}
            />
          )}
        />

        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <Select
              label="Account"
              selectedKeys={[field.value]}
              onSelectionChange={(k) =>
                field.onChange(Array.from(k)[0])
              }
            >
              {accounts.map((a) => (
                <SelectItem
                  key={a.id}
                  textValue={a.name}
                >
                  {a.name} (₹{Number(a.balance).toFixed(2)})
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </div>

      {/* CATEGORY */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <Select
            label="Category"
            selectedKeys={field.value ? [field.value] : []}
            onSelectionChange={(k) =>
              field.onChange(Array.from(k)[0])
            }
          >
            {filteredCategories.map((c) => (
              <SelectItem
                key={c.id}
                textValue={c.name}
              >
                {c.name}
              </SelectItem>
            ))}
          </Select>
        )}
      />

      {/* DATE */}
      <Popover>
        <PopoverTrigger>
          <Button variant="bordered" className="w-full justify-start">
            {date ? format(date, "PPP") : "Pick a date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setValue("date", d)}
          />
        </PopoverContent>
      </Popover>

      {/* DESCRIPTION */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Description"
            placeholder="Enter description"
          />
        )}
      />

      {/* RECURRING */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Recurring Transaction</p>
          <p className="text-sm text-muted-foreground">
            Set up a recurring schedule
          </p>
        </div>
        <Controller
          name="isRecurring"
          control={control}
          render={({ field }) => (
            <Switch
              isSelected={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <Button variant="bordered" onPress={() => router.back()}>
          Cancel
        </Button>

        <Button
          color="primary"
          type="submit"
          isDisabled={transactionLoading}
        >
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
