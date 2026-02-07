"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import { MoreVertical, Search } from "lucide-react";
import { format } from "date-fns";
import type { Transaction, TransactionType } from "@prisma/client";
import ConfirmDelete from "@/ui/confirmdelete";
import { deleteTransaction } from "@/actions/transaction";

/* ---------- DTO ---------- */
export interface TransactionDTO
  extends Omit<
    Transaction,
    | "amount"
    | "date"
    | "nextRecurringDate"
    | "lastProcessed"
    | "createdAt"
    | "updatedAt"
  > {
  amount: string;
  date: string;
}

interface Props {
  transactions: TransactionDTO[];
}

const PAGE_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

type SortKey = "date" | "amount" | null;
type SortDirection = "asc" | "desc";
type TypeFilter = "ALL" | TransactionType;

type SelectOption = {
  key: string;
  label: string;
};

export function TransactionTable({ transactions }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------- ACTION HANDLERS ---------- */

  const handleEdit = (id: string) => {
    router.push(`/transaction/create?edit=${id}`);
  };

  // DELETE
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);

      await deleteTransaction(deleteId);

      router.refresh(); // refresh UI
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- SELECT OPTIONS ---------- */

  const typeOptions: SelectOption[] = [
    { key: "ALL", label: "All" },
    { key: "INCOME", label: "Income" },
    { key: "EXPENSE", label: "Expense" },
  ];

  const categoryOptions: SelectOption[] = useMemo(() => {
    const unique = Array.from(
      new Set(transactions.map((t) => t.category))
    );

    return [
      { key: "ALL", label: "All categories" },
      ...unique.map((cat) => ({ key: cat, label: cat })),
    ];
  }, [transactions]);

  /* ---------- FILTER ---------- */

  const filtered = useMemo(() => {
    let data = transactions;

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "ALL") {
      data = data.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== "ALL") {
      data = data.filter((t) => t.category === categoryFilter);
    }

    return data;
  }, [transactions, search, typeFilter, categoryFilter]);

  /* ---------- SORT ---------- */

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal =
        sortKey === "amount"
          ? Number(a.amount)
          : new Date(a.date).getTime();

      const bVal =
        sortKey === "amount"
          ? Number(b.amount)
          : new Date(b.date).getTime();

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortKey, sortDirection]);

  /* ---------- PAGINATION ---------- */

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const indicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          startContent={<Search size={16} />}
          placeholder="Search transactions"
          value={search}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="max-w-sm"
        />

        <Select
          items={typeOptions}
          selectedKeys={new Set([typeFilter])}
          className="max-w-[160px]"
          onSelectionChange={(keys) => {
            setTypeFilter(Array.from(keys)[0] as TypeFilter);
            setPage(1);
          }}
        >
          {(item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          )}
        </Select>

        <Select
          items={categoryOptions}
          selectedKeys={new Set([categoryFilter])}
          className="max-w-[220px]"
          onSelectionChange={(keys) => {
            setCategoryFilter(Array.from(keys)[0] as string);
            setPage(1);
          }}
        >
          {(item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          )}
        </Select>
      </div>

      {/* Table */}
      <Table removeWrapper aria-label="Transactions table">
        <TableHeader>
          <TableColumn>
            <button onClick={() => toggleSort("date")}>
              Date{indicator("date")}
            </button>
          </TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Category</TableColumn>
          <TableColumn align="end">
            <button onClick={() => toggleSort("amount")}>
              Amount{indicator("amount")}
            </button>
          </TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Recurring</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>

        <TableBody emptyContent="No transactions found">
          {paginated.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                {format(new Date(tx.date), "dd MMM yyyy")}
              </TableCell>
              <TableCell>{tx.description ?? "—"}</TableCell>
              <TableCell>
                <Chip size="sm">{tx.category}</Chip>
              </TableCell>
              <TableCell
                className={`text-right ${
                  tx.type === "EXPENSE"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {currencyFormatter.format(Number(tx.amount))}
              </TableCell>
              <TableCell>
                <Chip size="sm">{tx.status}</Chip>
              </TableCell>
              <TableCell>
                {tx.isRecurring ? "Recurring" : "One-time"}
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="edit"
                      onPress={() => handleEdit(tx.id)}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      color="danger"
                      className="text-danger"
                      onPress={() => setDeleteId(tx.id)}
                    >
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            page={page}
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
