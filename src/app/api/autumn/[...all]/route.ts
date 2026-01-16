
import { autumnHandler } from "autumn-js/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    // Use next/headers for reliable session retrieval in Next.js 15
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Extract user ID safely
    const userId = session?.user?.id;

    if (!userId) {
      return null;
    }

    return {
      customerId: userId,
      customerData: {
        name: session.user.name || "User",
        email: session.user.email || "",
      },
    };
  },
});
