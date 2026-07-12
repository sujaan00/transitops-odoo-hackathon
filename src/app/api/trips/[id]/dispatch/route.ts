import { ok, fail } from "@/lib/api";
import { dispatchTrip } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("trips:manage");
    const { id } = await context.params;
    const trip = await dispatchTrip(id, user.id);
    return ok(trip);
  } catch (error) {
    return fail(error);
  }
}
