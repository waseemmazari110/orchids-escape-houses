import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const headersList = await headers();

    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      user: session.user.id,
      email: session.user.email,
      role: session.user.role || "guest",
      name: session.user.name,
    });
  } catch (error) {
    console.error("[Profile API] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
