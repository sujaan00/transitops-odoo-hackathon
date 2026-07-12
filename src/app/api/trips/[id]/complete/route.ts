import { ok, fail } from "@/lib/api";
import { completeTrip } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("trips:manage");
    const { id } = await context.params;
    const trip = await completeTrip({ ...(await request.json()), tripId: id }, user.id);
    return ok(trip);
  } catch (error) {
    return fail(error);
  }
}
