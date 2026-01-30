import { z } from "zod";

export const AccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Balance is required"),
  isDefault: z.boolean().default(false),
});

export type AccountInput = z.infer<typeof AccountSchema>;
