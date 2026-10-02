import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { FieldErrors, Resolver } from "react-hook-form";
import { z } from "zod";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { CityInput } from "@/components/ui/city-input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Clock, Truck, CarFront, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { cargoRoomLabel } from "@/lib/trips";
import type { NewTrip } from "@/lib/trips-store";
import { useTrips } from "@/lib/trips-store";
import { useUsers, isVehicleApproved, approvedVehicles } from "@/lib/users-store";

const tripSchema = z.object({
  origin: z.string().min(2, "Enter your origin city"),
  destination: z.string().min(2, "Enter your destination city"),
  departureDate: z.string().min(1, "Pick a departure date"),
  departureTime: z.string().min(1, "Pick a departure time"),
  vehicleId: z.string().min(1, "Pick the vehicle for this trip"),
  capacityKg: z.coerce
    .number({ message: "Enter a valid capacity" })
    .min(1, "Capacity must be at least 1 kg"),
  pricePerKg: z.coerce
    .number({ message: "Enter a valid price" })
    .positive("Price per kg must be positive"),
});

type TripFormValues = z.infer<typeof tripSchema>;

const tripResolver: Resolver<TripFormValues> = (values) => {
  const parsed = tripSchema.safeParse(values);
  if (parsed.success) {
    return { values: parsed.data, errors: {} };
  }
  const errors = {} as Record<string, { type: string; message: string }>;
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) {
      errors[key] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors: errors as FieldErrors<TripFormValues> };
};

type TripField = keyof TripFormValues;

const fieldLabels: Record<TripField, string> = {
  origin: "Origin",
  destination: "Destination",
  departureDate: "Departure date",
  departureTime: "Departure time",
  vehicleId: "Vehicle",
  capacityKg: "Available capacity",
  pricePerKg: "Price per kg",
};

const invalidInputClass =
  "border-destructive focus-visible:ring-destructive";

const PostTripForm = () => {
  const { addTrip } = useTrips();
  const { currentUser } = useUsers();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const vehicles = currentUser?.vehicles ?? [];
  const usableVehicles = approvedVehicles(currentUser);
  const pendingVehicles = vehicles.length - usableVehicles.length;
  const defaultVehicleId =
    usableVehicles.find((v) => v.isPrimary)?.id ?? usableVehicles[0]?.id ?? "";

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: tripResolver,
    defaultValues: {
      vehicleId: defaultVehicleId,
      capacityKg: undefined,
      pricePerKg: undefined,
    },
  });

  const vehicleId = watch("vehicleId");
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const missingFields = (Object.keys(errors) as TripField[]).map(
    (k) => fieldLabels[k] ?? k,
  );
  const onInvalid = (errs: FieldErrors<TripFormValues>) => {
    setSubmitAttempted(true);
    const missing = (Object.keys(errs) as TripField[])
      .map((k) => fieldLabels[k] ?? k)
      .filter(Boolean);
    if (missing.length > 0) {
      const noUsableVehicle = usableVehicles.length === 0 || vehicles.length === 0;
      toast("Fill all the fields to post your trip", {
        description: noUsableVehicle
          ? "No vehicle can be used yet — add one and get it verified by admin. The other details below also need to be filled."
          : `Still missing: ${missing.join(", ")}.`,
      });
    }
  };

  const onSubmit = async (values: TripFormValues) => {
    if (!currentUser || currentUser.role !== "driver" || !currentUser.name.trim()) {
      toast("Complete your driver profile first", {
        description: "Add your name in your profile so customers know who's posting this trip.",
      });
      return;
    }
    const vehicle = vehicles.find((v) => v.id === values.vehicleId);
    if (!vehicle) {
      toast("Pick the vehicle for this trip", {
        description: "Select one of your vehicles from the list below.",
      });
      return;
    }
    if (!isVehicleApproved(currentUser, vehicle.id)) {
      toast("Vehicle awaiting attestation", {
        description: `${vehicle.vehicleNumber} can't be used until admin verifies its RC document.`,
      });
      return;
    }
    const trip: NewTrip = {
      origin: values.origin,
      destination: values.destination,
      departureDate: values.departureDate,
      departureTime: values.departureTime,
      vehicleType: vehicle.vehicleType,
      capacityKg: values.capacityKg,
      pricePerKg: values.pricePerKg,
    };
    try {
      await addTrip(trip, { vehicleNumber: vehicle.vehicleNumber });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not post your trip.", {
        description: "Your trip was not saved. Please check the details and try again.",
      });
      return;
    }
    toast("Trip posted!", {
      description: `${values.origin} → ${values.destination} via ${vehicle.vehicleNumber} is now live for customers.`,
    });
    reset({ vehicleId: values.vehicleId });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      onSubmitCapture={() => setSubmitAttempted(true)}
      className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold">Post a trip</h3>
          <p className="text-sm text-muted-foreground">Share your spare capacity with customers</p>
        </div>
      </div>

      {submitAttempted && missingFields.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Fill all the fields to post your trip.</span>{" "}
            Still missing:{" "}
            <span className="font-medium">{missingFields.join(", ")}</span>.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Controller
            control={control}
            name="origin"
            render={({ field }) => (
              <CityInput
                id="origin"
                placeholder="e.g. Mumbai"
                scope="origin"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {errors.origin && <p className="text-sm text-destructive">{errors.origin.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Controller
            control={control}
            name="destination"
            render={({ field }) => (
              <CityInput
                id="destination"
                placeholder="e.g. Pune"
                scope="destination"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {errors.destination && <p className="text-sm text-destructive">{errors.destination.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departureDate">Departure date</Label>
          <Controller
            control={control}
            name="departureDate"
            render={({ field }) => (
              <DatePicker
                id="departureDate"
                value={field.value ?? ""}
                onChange={field.onChange}
                min={today}
                aria-invalid={!!errors.departureDate}
                className={cn(errors.departureDate && invalidInputClass)}
              />
            )}
          />
          {errors.departureDate && <p className="text-sm text-destructive">{errors.departureDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureTime">Departure time</Label>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="departureTime"
              type="time"
              aria-invalid={!!errors.departureTime}
              className={cn("pl-9", errors.departureTime && invalidInputClass)}
              {...register("departureTime")}
            />
          </div>
          {errors.departureTime && <p className="text-sm text-destructive">{errors.departureTime.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Your vehicle for this trip</Label>
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            You haven't added any vehicles yet. Add one in{" "}
            <Link to="/settings" className="font-semibold text-primary underline">
              account settings
            </Link>{" "}
            to start posting trips.
          </div>
        ) : usableVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            Your vehicles are waiting for admin attestation. Once their RC documents are
            verified in{" "}
            <Link to="/settings" className="font-semibold text-primary underline">
              account settings
            </Link>
            , they'll be available for trips here.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {usableVehicles.map((v) => {
                const active = vehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setValue("vehicleId", v.id, { shouldValidate: true })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      active ? "border-primary bg-primary/10" : "hover:bg-accent",
                    )}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <CarFront className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold uppercase tracking-wide">{v.vehicleNumber}</span>
                      <span className="block text-xs text-muted-foreground">
                        {v.vehicleType}
                        {cargoRoomLabel(v) ? ` · ${cargoRoomLabel(v)}` : ""}
                      </span>
                    </span>
                    {active ? (
                      <span className="ml-auto shrink-0 text-xs font-medium text-primary">Selected</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {pendingVehicles > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingVehicles} vehicle{pendingVehicles === 1 ? "" : "s"} pending RC
                verification can't be used until admin approves them.
              </p>
            )}
          </>
        )}
        {selectedVehicle ? (
          <p className="text-xs text-muted-foreground">
            This trip will post with your {selectedVehicle.vehicleType.toLowerCase()} · {selectedVehicle.vehicleNumber}
          </p>
        ) : null}
        {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacityKg">Available capacity (kg)</Label>
          <Input
            id="capacityKg"
            type="number"
            min="1"
            placeholder="e.g. 1500"
            aria-invalid={!!errors.capacityKg}
            className={cn(errors.capacityKg && invalidInputClass)}
            {...register("capacityKg")}
          />
          {errors.capacityKg && <p className="text-sm text-destructive">{errors.capacityKg.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerKg">Price per kg (₹)</Label>
          <Input
            id="pricePerKg"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 12"
            aria-invalid={!!errors.pricePerKg}
            className={cn(errors.pricePerKg && invalidInputClass)}
            {...register("pricePerKg")}
          />
          {errors.pricePerKg && <p className="text-sm text-destructive">{errors.pricePerKg.message}</p>}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        type="submit"
        disabled={isSubmitting}
      >
        <Truck className="h-5 w-5" />
        Post my trip
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/settings" className="inline-flex items-center gap-1 font-semibold text-primary underline">
          <Plus className="h-3.5 w-3.5" />
          Manage your vehicles
        </Link>
      </p>
    </form>
  );
};

export default PostTripForm;