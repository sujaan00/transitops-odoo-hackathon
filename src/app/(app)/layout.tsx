import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const unreadCount = await prisma.notification.count({
    where: {
      OR: [{ userId: session.user.id }, { userId: null }],
      readAt: null
    }
  });

  return <AppShell user={session.user} unreadCount={unreadCount}>{children}</AppShell>;
}
