import { ok, fail } from "@/lib/api";
import { createVehicle } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("vehicles:manage");
    const vehicle = await createVehicle(await request.json(), user.id);
    return ok(vehicle, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
