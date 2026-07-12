import { ok, fail } from "@/lib/api";
import { completeMaintenance } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("maintenance:manage");
    const { id } = await context.params;
    const maintenance = await completeMaintenance({ ...(await request.json()), maintenanceId: id }, user.id);
    return ok(maintenance);
  } catch (error) {
    return fail(error);
  }
}
