"use client";

import { format } from "date-fns";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";
import { formatCurrency, formatNumber } from "@/lib/format";
import { asNumber } from "@/lib/utils";

type VehicleOption = {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  vehicleType: string;
  maxLoadCapacity: unknown;
  region: string;
  currentOdometer: number;
};

type DriverOption = {
  id: string;
  name: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  safetyScore: number;
  region: string;
};

const steps = ["Route", "Cargo", "Vehicle", "Driver", "Financials", "Review"];

export function TripWizard({ vehicles, drivers }: { vehicles: VehicleOption[]; drivers: DriverOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    region: "",
    plannedDistance: "",
    cargoWeight: "",
    vehicleId: "",
    driverId: "",
    revenue: "",
    plannedStartDate: format(new Date(), "yyyy-MM-dd")
  });

  const cargo = Number(form.cargoWeight || 0);
  const eligibleVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const capacityOk = !cargo || asNumber(vehicle.maxLoadCapacity) >= cargo;
        const regionOk = !form.region || vehicle.region.toLowerCase() === form.region.toLowerCase();
        return capacityOk && regionOk;
      }),
    [vehicles, cargo, form.region]
  );

  const eligibleDrivers = useMemo(
    () => drivers.filter((driver) => !form.region || driver.region.toLowerCase() === form.region.toLowerCase()),
    [drivers, form.region]
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
  const selectedDriver = drivers.find((driver) => driver.id === form.driverId);
  const overCapacity = selectedVehicle && cargo > asNumber(selectedVehicle.maxLoadCapacity);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function canContinue() {
    if (step === 0) return form.source && form.destination && form.region && Number(form.plannedDistance) > 0;
    if (step === 1) return Number(form.cargoWeight) > 0;
    if (step === 2) return form.vehicleId && !overCapacity;
    if (step === 3) return form.driverId;
    if (step === 4) return form.plannedStartDate && Number(form.revenue) >= 0;
    return true;
  }

  async function submit() {
    setLoading(true);
    try {
      const trip = await postJson<{ id: string }>("/api/trips", form);
      toast.success("Trip created as draft.");
      router.push(`/trips/${trip.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trip could not be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-5">
        <div className="grid gap-2 sm:grid-cols-6">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span className={index === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6">
        {step === 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Source" value={form.source} onChange={(value) => update("source", value)} placeholder="Delhi" />
            <Input label="Destination" value={form.destination} onChange={(value) => update("destination", value)} placeholder="Jaipur" />
            <Input label="Region" value={form.region} onChange={(value) => update("region", value)} placeholder="North" />
            <Input label="Planned Distance (km)" value={form.plannedDistance} onChange={(value) => update("plannedDistance", value)} type="number" />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="max-w-xl">
            <Input label="Cargo Weight (kg)" value={form.cargoWeight} onChange={(value) => update("cargoWeight", value)} type="number" />
            <p className="mt-3 text-sm text-muted-foreground">Vehicle eligibility updates immediately based on region and capacity.</p>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {eligibleVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => update("vehicleId", vehicle.id)}
                className={`rounded-lg border p-4 text-left transition hover:bg-muted ${form.vehicleId === vehicle.id ? "border-primary bg-accent" : "bg-background"}`}
              >
                <p className="font-semibold">{vehicle.registrationNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">{vehicle.vehicleName}</p>
                <p className="mt-3 text-sm">{vehicle.vehicleType}</p>
                <p className="text-xs text-muted-foreground">Capacity {formatNumber(vehicle.maxLoadCapacity, " kg")} · {vehicle.region}</p>
              </button>
            ))}
            {eligibleVehicles.length === 0 ? <p className="text-sm text-muted-foreground">No available vehicle matches this region and cargo weight.</p> : null}
          </div>
        ) : null}
        {step === 3 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {eligibleDrivers.map((driver) => (
              <button
                key={driver.id}
                type="button"
                onClick={() => update("driverId", driver.id)}
                className={`rounded-lg border p-4 text-left transition hover:bg-muted ${form.driverId === driver.id ? "border-primary bg-accent" : "bg-background"}`}
              >
                <p className="font-semibold">{driver.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{driver.licenseCategory} · Safety {driver.safetyScore}</p>
                <p className="mt-3 text-xs text-muted-foreground">License valid until {format(new Date(driver.licenseExpiryDate), "dd MMM yyyy")} · {driver.region}</p>
              </button>
            ))}
            {eligibleDrivers.length === 0 ? <p className="text-sm text-muted-foreground">No available valid driver matches this region.</p> : null}
          </div>
        ) : null}
        {step === 4 ? (
          <div className="grid max-w-2xl gap-5 md:grid-cols-2">
            <Input label="Planned Start Date" value={form.plannedStartDate} onChange={(value) => update("plannedStartDate", value)} type="date" />
            <Input label="Expected Revenue (INR)" value={form.revenue} onChange={(value) => update("revenue", value)} type="number" />
          </div>
        ) : null}
        {step === 5 ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {[
              ["Route", `${form.source} to ${form.destination}`],
              ["Region", form.region],
              ["Distance", `${form.plannedDistance} km`],
              ["Cargo", `${form.cargoWeight} kg`],
              ["Vehicle", selectedVehicle ? `${selectedVehicle.registrationNumber} · ${selectedVehicle.vehicleName}` : "Not selected"],
              ["Driver", selectedDriver ? selectedDriver.name : "Not selected"],
              ["Planned start", form.plannedStartDate],
              ["Revenue", formatCurrency(form.revenue)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {overCapacity ? (
        <div className="mx-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Cargo exceeds the selected vehicle capacity. Choose a larger vehicle before continuing.
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t p-5">
        <Button variant="outline" disabled={step === 0 || loading} onClick={() => setStep((value) => Math.max(0, value - 1))}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button disabled={!canContinue()} onClick={() => setStep((value) => value + 1)}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={loading || !canContinue()} onClick={submit}>
            {loading ? "Creating..." : "Create trip"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 w-full" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
