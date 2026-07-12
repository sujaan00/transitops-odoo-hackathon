import { ok, fail } from "@/lib/api";
import { createDriver } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("drivers:manage");
    const driver = await createDriver(await request.json(), user.id);
    return ok(driver, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
