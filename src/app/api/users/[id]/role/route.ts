import { Role, roles } from "@/lib/domain";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { AppError } from "@/lib/errors";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("users:manage");
    const { id } = await context.params;
    const body = (await request.json()) as { role?: Role };

    if (!body.role || !roles.includes(body.role)) {
      throw new AppError("Select a valid role.", "VALIDATION_ERROR", 422);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, name: true, email: true, role: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_ROLE_UPDATED",
        entityType: "User",
        entityId: id,
        description: `${updated.name}'s role was updated to ${updated.role}.`
      }
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
