import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Force dynamic rendering for dashboard
export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  
  const session = await auth.api.getSession({
    headers: headersList,
  });

  const user = session?.user as any;
  const role = user?.role;

  // Redirect unauthenticated users to admin login
  if (!user) {
    redirect("/admin/login");
  }

  // Only admins can access dashboard
  if (role !== "admin") {
    if (role === "owner") {
      redirect("/owner/dashboard");
    } else {
      redirect("/");
    }
  }

  return <>{children}</>;
}
