"use client";

import { CheckCircle2, Play, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TripStatus } from "@/lib/domain";
import { postJson } from "@/lib/client";

export function TripActions({ tripId, status }: { tripId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: "dispatch" | "cancel") {
    setLoading(action);
    try {
      await postJson(`/api/trips/${tripId}/${action}`);
      toast.success(action === "dispatch" ? "Trip dispatched. Vehicle and driver are now on trip." : "Trip cancelled.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trip action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === TripStatus.DRAFT ? (
        <Button size="sm" disabled={loading === "dispatch"} onClick={() => void run("dispatch")}>
          <Play className="h-4 w-4" />
          {loading === "dispatch" ? "Dispatching..." : "Dispatch"}
        </Button>
      ) : null}
      {status === TripStatus.DISPATCHED ? (
        <Link href={`/trips/${tripId}/complete`} className="inline-flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Complete
        </Link>
      ) : null}
      {(status === TripStatus.DRAFT || status === TripStatus.DISPATCHED) ? (
        <Button size="sm" variant="outline" disabled={loading === "cancel"} onClick={() => void run("cancel")}>
          <XCircle className="h-4 w-4" />
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
