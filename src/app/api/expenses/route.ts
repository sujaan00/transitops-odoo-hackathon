import { ok, fail } from "@/lib/api";
import { createExpense } from "@/lib/operations";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("finance:manage");
    const expense = await createExpense(await request.json(), user.id);
    return ok(expense, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
