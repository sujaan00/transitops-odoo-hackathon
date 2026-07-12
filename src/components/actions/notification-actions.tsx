"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function MarkNotificationRead({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markRead() {
    setLoading(true);
    try {
      await postJson(`/api/notifications/${id}/read`);
      toast.success("Notification marked read.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification could not be updated.");
    } finally {
      setLoading(false);
    }
  }

  if (read) return null;

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={() => void markRead()}>
      <Check className="h-4 w-4" />
      Mark read
    </Button>
  );
}
