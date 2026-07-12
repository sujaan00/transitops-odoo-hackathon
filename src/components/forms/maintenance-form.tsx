"use client";

import { MaintenanceStatus, labelize, maintenanceStatuses } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

type VehicleOption = {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  currentOdometer: number;
};

export function MaintenanceForm({ vehicles }: { vehicles: VehicleOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const maintenance = await postJson<{ id: string }>("/api/maintenance", body);
      toast.success("Maintenance record saved.");
      router.push("/maintenance");
      router.refresh();
      return maintenance;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Maintenance could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <label className="block text-sm font-medium">
        Vehicle
        <select name="vehicleId" required className="mt-2 w-full">
          <option value="">Select vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.registrationNumber} · {vehicle.vehicleName}
            </option>
          ))}
        </select>
      </label>
      <Field label="Maintenance Type" name="maintenanceType" placeholder="Oil Change" required />
      <label className="block text-sm font-medium md:col-span-2">
        Description
        <textarea name="description" required className="mt-2 min-h-24 w-full" placeholder="Work to be performed" />
      </label>
      <Field label="Start Date" name="startDate" type="date" required />
      <Field label="Odometer at Service" name="odometerAtService" type="number" min="0" required />
      <Field label="Estimated / Final Cost (INR)" name="cost" type="number" min="0" defaultValue="0" />
      <Field label="Service Provider" name="serviceProvider" placeholder="FleetCare Workshop" />
      <label className="block text-sm font-medium">
        Status
        <select name="status" defaultValue={MaintenanceStatus.ACTIVE} className="mt-2 w-full">
          {maintenanceStatuses.map((status) => (
            <option key={status} value={status}>
              {labelize(status)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium md:col-span-2">
        Notes
        <textarea name="notes" className="mt-2 min-h-20 w-full" />
      </label>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Saving..." : "Save maintenance"}</Button>
      </div>
    </form>
  );
}

export function CompleteMaintenanceForm({ maintenanceId }: { maintenanceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      await postJson(`/api/maintenance/${maintenanceId}/complete`, body);
      toast.success("Maintenance closed. Vehicle availability updated.");
      router.push("/maintenance");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Maintenance could not be closed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <Field label="Final Cost (INR)" name="cost" type="number" min="0" required />
      <Field label="Completion Date" name="completionDate" type="date" required />
      <label className="block text-sm font-medium md:col-span-2">
        Notes
        <textarea name="notes" className="mt-2 min-h-24 w-full" />
      </label>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Closing..." : "Close maintenance"}</Button>
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
