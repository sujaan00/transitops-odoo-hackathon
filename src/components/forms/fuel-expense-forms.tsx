"use client";

import { ExpenseCategory, expenseCategories, labelize } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

type VehicleOption = {
  id: string;
  registrationNumber: string;
  vehicleName: string;
};

type TripOption = {
  id: string;
  tripNumber: string;
};

export function FuelLogForm({ vehicles, trips }: { vehicles: VehicleOption[]; trips: TripOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await postJson("/api/fuel", body);
      toast.success("Fuel log added.");
      router.push("/fuel-expenses");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fuel log could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <VehicleSelect vehicles={vehicles} />
      <TripSelect trips={trips} />
      <Field label="Date" name="date" type="date" required />
      <Field label="Liters" name="liters" type="number" min="0.1" step="0.1" required />
      <Field label="Total Cost (INR)" name="totalCost" type="number" min="0.1" step="0.01" required />
      <Field label="Odometer" name="odometer" type="number" min="0" required />
      <Field label="Fuel Station" name="fuelStation" placeholder="IOCL NH48 Jaipur" />
      <label className="block text-sm font-medium md:col-span-2">
        Notes
        <textarea name="notes" className="mt-2 min-h-20 w-full" />
      </label>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Saving..." : "Save fuel log"}</Button>
      </div>
    </form>
  );
}

export function ExpenseForm({ vehicles, trips }: { vehicles: VehicleOption[]; trips: TripOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await postJson("/api/expenses", body);
      toast.success("Expense recorded.");
      router.push("/fuel-expenses");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Expense could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
      <VehicleSelect vehicles={vehicles} />
      <TripSelect trips={trips} />
      <label className="block text-sm font-medium">
        Category
        <select name="category" defaultValue={ExpenseCategory.TOLL} className="mt-2 w-full">
          {expenseCategories.map((category) => (
            <option key={category} value={category}>
              {labelize(category)}
            </option>
          ))}
        </select>
      </label>
      <Field label="Date" name="date" type="date" required />
      <Field label="Amount (INR)" name="amount" type="number" min="0.1" step="0.01" required />
      <Field label="Receipt Reference" name="receiptReference" />
      <label className="block text-sm font-medium md:col-span-2">
        Description
        <input name="description" className="mt-2 w-full" required />
      </label>
      <label className="block text-sm font-medium md:col-span-2">
        Notes
        <textarea name="notes" className="mt-2 min-h-20 w-full" />
      </label>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Saving..." : "Save expense"}</Button>
      </div>
    </form>
  );
}

function VehicleSelect({ vehicles }: { vehicles: VehicleOption[] }) {
  return (
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
  );
}

function TripSelect({ trips }: { trips: TripOption[] }) {
  return (
    <label className="block text-sm font-medium">
      Trip (optional)
      <select name="tripId" className="mt-2 w-full">
        <option value="">No trip</option>
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id}>
            {trip.tripNumber}
          </option>
        ))}
      </select>
    </label>
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
