import { z } from "zod";

// Account Schema
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Balance must be a valid number"),
  isDefault: z.boolean(),
});

export type AccountFormData = z.infer<typeof accountSchema>;


// Transaction Schema
export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z
      .string()
      .min(1, "Amount is required")
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
    description: z.string().optional(),

    date: z
      .preprocess(
        (val) => {
          if (typeof val === "string" || val instanceof Date) {
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? undefined : parsed;
          }
          return undefined;
        },
        z.date()
      )
      .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
        message: "Date is required",
      }),

    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

export type TransactionFormData = z.infer<typeof transactionSchema>;