import { redirect } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div data-surface="admin" data-palette="claret">
      <Shell breadcrumb={["Bentropy"]}>{children}</Shell>
    </div>
  );
}
