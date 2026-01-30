import { seedTransactions } from "@/actions/seed-transactions"; // adjust path
import { NextResponse } from "next/server";

export async function GET() {
  const result = await seedTransactions(); // uses fallback account + user OR pass IDs manually
  return NextResponse.json(result);
}
