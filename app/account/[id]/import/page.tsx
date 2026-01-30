import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountWithTransactions } from "@/actions/accounts";
import ImportStatement from "./_components/import-statement";

type Props = {
  params: { id?: string } | Promise<{ id?: string }>;
};

export default async function ImportAccountPage({ params }: Props) {
  const resolved = await params;
  const id = resolved.id;

  if (!id) notFound();

  const accountData = await getAccountWithTransactions(id);
  if (!accountData) notFound();

  const { transactions, ...account } = accountData;

  return (
    <div className="max-w-3xl space-y-6 px-5 py-6">
      <Link
        href={`/account/${account.id}`}
        aria-label="Back to Account"
        className="
          inline-flex items-center gap-2
          rounded-md border border-primary/40
          px-4 py-2
          text-sm font-medium text-primary
          transition-colors
          hover:border-primary
          hover:bg-primary/10
        "
      >
        <span aria-hidden>←</span>
        Back to Account
      </Link>

      <h1 className="text-2xl font-semibold">
        Import Statement
      </h1>

      <p className="text-sm text-muted-foreground">
        Import transactions for <strong>{account.name}</strong>
      </p>

      <ImportStatement account={account} />
    </div>
  );
}
