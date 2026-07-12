import { ok, fail } from "@/lib/api";
import { createFuelLog } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("finance:manage");
    const fuelLog = await createFuelLog(await request.json(), user.id);
    return ok(fuelLog, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
