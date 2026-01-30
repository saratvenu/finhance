// app/api/transactions/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved = await context.params;
  const id = resolved?.id;

  if (!id) {
    return NextResponse.json(
      { error: "Missing transaction id" },
      { status: 400 }
    );
  }

  try {
    await db.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
