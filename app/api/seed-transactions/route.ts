import { NextResponse } from "next/server";
import { seedTransactions } from "@/actions/seed-transactions";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { accountId, days } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const result = await seedTransactions(
      accountId,
      userId,
      typeof days === "number" ? days : 5
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Seed transactions API error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
