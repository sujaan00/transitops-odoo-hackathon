import { ok, fail } from "@/lib/api";
import { createMaintenance } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("maintenance:manage");
    const maintenance = await createMaintenance(await request.json(), user.id);
    return ok(maintenance, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
