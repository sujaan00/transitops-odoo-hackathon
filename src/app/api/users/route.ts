import { ok, fail } from "@/lib/api";
import { createUser } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("users:manage");
    const created = await createUser(await request.json(), user.id);
    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
