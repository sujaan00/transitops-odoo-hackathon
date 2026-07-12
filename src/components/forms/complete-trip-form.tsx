"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function CompleteTripForm({ tripId, startOdometer }: { tripId: string; startOdometer: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      await postJson(`/api/trips/${tripId}/complete`, body);
      toast.success("Trip completed. Vehicle and driver are available again.");
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trip could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <div className="md:col-span-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">Start odometer: {startOdometer.toLocaleString("en-IN")} km</div>
      <Field label="Final Odometer (km)" name="finalOdometer" type="number" min={startOdometer + 1} required />
      <Field label="Fuel Consumed (L)" name="fuelConsumed" type="number" min="0" step="0.1" />
      <Field label="Fuel Cost (INR)" name="fuelCost" type="number" min="0" step="0.01" />
      <Field label="Fuel Station" name="fuelStation" placeholder="IOCL NH48 Jaipur" />
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Completing..." : "Complete trip"}</Button>
      </div>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 w-full" {...inputProps} />
    </label>
  );
}
