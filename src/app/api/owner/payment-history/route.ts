import { auth } from "@/lib/auth";
import { db } from "@/db";
import { payments } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get owner's payment history
    const paymentHistory = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .limit(20);

    return NextResponse.json({ payments: paymentHistory });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
