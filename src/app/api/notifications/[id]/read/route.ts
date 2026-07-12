import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("notifications:read");
    const { id } = await context.params;
    await prisma.notification.updateMany({
      where: { id, OR: [{ userId: user.id }, { userId: null }] },
      data: { readAt: new Date() }
    });
    const notification = await prisma.notification.findUniqueOrThrow({
      where: { id }
    });
    return ok(notification);
  } catch (error) {
    return fail(error);
  }
}
