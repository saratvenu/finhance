import { notFound } from "next/navigation";

// Actions
import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transaction";

// Data
import { defaultCategories } from "@/data/categories";

// Components
import { AddTransactionForm } from "../_components/transaction-form";

// HeroUI
import { Card, CardBody } from "@heroui/card";

// Types
import type { AccountDTO } from "@/actions/dashboard";
import type { TransactionFormData } from "@/app/lib/schema";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PageProps {
  searchParams: Promise<{
    edit?: string;
    id?: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function AddTransactionPage({
  searchParams,
}: PageProps) {
  const accounts: AccountDTO[] = await getUserAccounts();

  const params = await searchParams;

  const editId = params.edit ?? params.id ?? null;

  let initialData: TransactionFormData | null = null;

  if (editId) {
    const transaction = await getTransaction(editId);
    if (!transaction) notFound();

    initialData = {
      type: transaction.type,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date),
      accountId: transaction.accountId,
      category: transaction.category,
      isRecurring: transaction.isRecurring,
      description: transaction.description ?? undefined,
      recurringInterval: transaction.recurringInterval ?? undefined,
    };
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-start mb-8">
        <h1 className="text-5xl font-bold gradient-title">
          {editId ? "Edit Transaction" : "Add Transaction"}
        </h1>
      </div>

      <Card>
        <CardBody>
          <AddTransactionForm
            accounts={accounts}
            categories={defaultCategories}
            editMode={Boolean(editId)}
            initialData={initialData}
          />
        </CardBody>
      </Card>
    </div>
  );
}
