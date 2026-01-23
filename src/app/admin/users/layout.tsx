import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
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

  if (!user) {
    redirect("/admin/login");
  }

  if (role !== "admin") {
    if (role === "owner") {
      redirect("/owner/dashboard");
    } else {
      redirect("/");
    }
  }

  return <>{children}</>;
}
