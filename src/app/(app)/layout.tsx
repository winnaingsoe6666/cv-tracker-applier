import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { NavLinks } from "@/components/nav-links";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col border-r border-edge bg-surface">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-dim text-sm font-bold text-[#06281c]">C</div>
          <span className="font-semibold tracking-tight">CareerForge</span>
        </Link>
        <NavLinks isAdmin={user.isAdmin} />
        <div className="mt-auto border-t border-edge px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-faint">{user.email}</p>
            </div>
            <Badge tone={user.plan === "PRO" ? "accent" : "neutral"}>{user.plan}</Badge>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="mt-3 w-full rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:border-danger/40 hover:text-danger">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="ml-56 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
