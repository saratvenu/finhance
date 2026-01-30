"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  name: string;
};

type PreviewTransaction = {
  date: string | Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
};

type Props = {
  account: Account;
};

export default function ImportStatement({ account }: Props) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewTransaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* ------------------------------------------------------------ */
  /* Preview                                                      */
  /* ------------------------------------------------------------ */
  async function handlePreview() {
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", account.id);

    const res = await fetch("/api/import/account/preview", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to preview import");
      return;
    }

    setPreview(data.preview);
  }

  /* ------------------------------------------------------------ */
  /* Confirm                                                      */
  /* ------------------------------------------------------------ */
  async function confirmImport(transactions: PreviewTransaction[]) {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/import/account/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: account.id,
        transactions,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Import failed");
      return;
    }

    setPreview(null);
    setMessage(`Imported ${data.imported} transactions successfully`);
  }

  /* ------------------------------------------------------------ */
  /* Preview UI                                                   */
  /* ------------------------------------------------------------ */
  if (preview) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">
          Preview ({preview.length} transactions)
        </h3>

        <div className="max-h-80 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((t, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="p-2">{t.description}</td>
                  <td className="p-2 text-right">{t.amount}</td>
                  <td className="p-2">{t.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => confirmImport(preview)}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            {loading ? "Importing…" : "Confirm Import"}
          </button>

          <button
            onClick={() => setPreview(null)}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>

        {message && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{message}</p>

            <button
              onClick={() => router.push(`/account/${account.id}`)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to Account
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* Upload UI                                                    */
  /* ------------------------------------------------------------ */
  return (
    <div className="space-y-6">
      {/* File picker */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="statement-file"
          className="cursor-pointer rounded-md border px-4 py-2 text-sm
            hover:bg-muted
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-primary"
        >
          Choose file
        </label>

        <input
          id="statement-file"
          type="file"
          accept=".csv,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        <span className="text-sm text-muted-foreground">
          {file ? file.name : "No file chosen"}
        </span>
      </div>

      {/* Action */}
      <button
        onClick={handlePreview}
        disabled={!file || loading}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        {loading ? "Processing…" : "Preview Import"}
      </button>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
