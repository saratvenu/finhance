import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

import {
  processRecurringTransaction,
  triggerRecurringTransactions,
  generateMonthlyReports,
  checkBudgetAlerts,
} from "@/lib/inngest/functions";

const handlers = serve({
  client: inngest,
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
});

// Type assertions to fix Next.js 16 compatibility
export const GET = handlers.GET as any;
export const POST = handlers.POST as any;
export const PUT = handlers.PUT as any;