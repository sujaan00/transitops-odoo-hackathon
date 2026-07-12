import { UserForm, RoleSelect } from "@/components/forms/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { Role } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("users:manage");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <PageHeader title="Users" description="Admin-only user management and role assignment." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <UserForm />
        <Card>
          <CardHeader><CardTitle>Team Access</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">User</th><th>Role</th><th>Created</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td><RoleSelect userId={user.id} role={user.role as Role} /></td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
