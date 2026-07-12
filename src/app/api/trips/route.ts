import { ok, fail } from "@/lib/api";
import { createTrip } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("trips:manage");
    const trip = await createTrip(await request.json(), user.id);
    return ok(trip, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
