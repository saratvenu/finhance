// app/api/account/[id]/route.ts
import { NextResponse } from "next/server";
import { getAccountWithTransactions } from "@/actions/accounts";

export async function GET(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const { params } = context;
  const resolved = (await params) as { id: string };
  const { id } = resolved;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const data = await getAccountWithTransactions(id);
    if (!data) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
