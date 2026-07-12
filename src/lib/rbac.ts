import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new AppError("You must be signed in to continue.", "UNAUTHORIZED", 401);
  }

  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!hasPermission(user.role, permission)) {
    throw new AppError("You do not have permission to perform this action.", "FORBIDDEN", 403);
  }

  return user;
}
