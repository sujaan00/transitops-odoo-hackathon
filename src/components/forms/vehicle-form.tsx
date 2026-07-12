"use client";

import { VehicleStatus, vehicleStatuses, labelize } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function VehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const vehicle = await postJson<{ id: string }>("/api/vehicles", body);
      toast.success("Vehicle added to the fleet.");
      router.push(`/vehicles/${vehicle.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vehicle could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <Field label="Registration Number" name="registrationNumber" placeholder="MH 12 AB 4581" required />
      <Field label="Vehicle Name" name="vehicleName" placeholder="Pune Reefer 01" required />
      <Field label="Manufacturer" name="manufacturer" placeholder="Tata" required />
      <Field label="Model" name="model" placeholder="Prima 2528.K" required />
      <Field label="Vehicle Type" name="vehicleType" placeholder="Cargo Van" required />
      <Field label="Region" name="region" placeholder="West" required />
      <Field label="Maximum Load Capacity (kg)" name="maxLoadCapacity" type="number" min="1" step="0.1" required />
      <Field label="Current Odometer (km)" name="currentOdometer" type="number" min="0" required />
      <Field label="Acquisition Cost (INR)" name="acquisitionCost" type="number" min="0" required />
      <Field label="Acquisition Date" name="acquisitionDate" type="date" required />
      <label className="block text-sm font-medium">
        Status
        <select name="status" defaultValue={VehicleStatus.AVAILABLE} className="mt-2 w-full">
          {vehicleStatuses.map((status) => (
            <option key={status} value={status}>
              {labelize(status)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Saving..." : "Save vehicle"}</Button>
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
