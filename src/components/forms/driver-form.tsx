"use client";

import { DriverStatus, driverStatuses, labelize } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function DriverForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const driver = await postJson<{ id: string }>("/api/drivers", body);
      toast.success("Driver added to the roster.");
      router.push(`/drivers/${driver.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Driver could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <Field label="Full Name" name="name" placeholder="Harpreet Singh" required />
      <Field label="Email" name="email" type="email" placeholder="driver@example.com" />
      <Field label="License Number" name="licenseNumber" placeholder="DL0120180087112" required />
      <Field label="License Category" name="licenseCategory" placeholder="HMV" required />
      <Field label="License Expiry Date" name="licenseExpiryDate" type="date" required />
      <Field label="Contact Number" name="contactNumber" placeholder="+91 98765 43210" required />
      <Field label="Safety Score" name="safetyScore" type="number" min="0" max="100" required />
      <Field label="Region" name="region" placeholder="North" required />
      <label className="block text-sm font-medium">
        Status
        <select name="status" defaultValue={DriverStatus.AVAILABLE} className="mt-2 w-full">
          {driverStatuses.map((status) => (
            <option key={status} value={status}>
              {labelize(status)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Saving..." : "Save driver"}</Button>
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
