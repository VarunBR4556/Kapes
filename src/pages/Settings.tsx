import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/theme-toggle";
import { Truck, Home, LogOut, User, Phone, Mail, CarFront, Plus, Trash2, Star, FileText, Upload, ShieldCheck, ShieldX, Hourglass, IdCard, AlertTriangle, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, cargoRoomLabel, type VehicleType } from "@/lib/trips";
import {
  useUsers,
  primaryVehicle,
  findDriverDocument,
  docKindLabels,
  docStatusLabels,
} from "@/lib/users-store";
import type { DriverDocumentKind, Vehicle } from "@/lib/users-store";
import { useTrips } from "@/lib/trips-store";
import PdfFileInput from "@/components/driver/PdfFileInput";
import type { PdfSelection } from "@/components/driver/PdfFileInput";
import ProfilePhoto from "@/components/profile/ProfilePhoto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const TypeButtons = ({
  value,
  onChange,
}: {
  value: VehicleType;
  onChange: (v: VehicleType) => void;
}) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {VEHICLE_TYPES.map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
          value === v ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
        )}
      >
        {v}
      </button>
    ))}
  </div>
);

const Settings = () => {
  const {
    currentUser,
    updateUser,
    addVehicle,
    removeVehicle,
    setPrimaryVehicle,
    addDriverDocument,
    logout,
  } = useUsers();
  const { updateTripDriver } = useTrips();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [nameTouched, setNameTouched] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newType, setNewType] = useState<VehicleType>("Truck");
  const [newRc, setNewRc] = useState<PdfSelection | null>(null);

  const [licenceUploading, setLicenceUploading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Vehicle | null>(null);

  if (!currentUser) return null;

  const isDriver = currentUser.role === "driver";
  const vehicles = currentUser.vehicles ?? [];
  const primary = primaryVehicle(currentUser);

  const nameValid = name.trim().length >= 2;

  const handleSaveProfile = () => {
    setNameTouched(true);
    if (!nameValid) return;
    updateUser({ name: name.trim(), phone: phone.trim() || undefined });
    void updateTripDriver({ name: name.trim() });
    toast("Profile saved", { description: "Your account details are up to date." });
  };

  const handleAddVehicle = async () => {
    const number = newNumber.trim().toUpperCase();
    if (number.length < 4) {
      toast("Enter a valid vehicle number", { description: "Vehicle number looks too short." });
      return;
    }
    if (vehicles.some((v) => v.vehicleNumber === number)) {
      toast("Vehicle already added", { description: `${number} is already on your account.` });
      return;
    }
    if (!newRc) {
      toast("Upload the vehicle's RC document", {
        description: "A registration certificate (RC) PDF is required before a vehicle can be used.",
      });
      return;
    }
    const vehicle = await addVehicle({ vehicleNumber: number, vehicleType: newType });
    if (vehicle) {
      await addDriverDocument({
        kind: "vehicle_rc",
        vehicleId: vehicle.id,
        fileName: newRc.fileName,
        data: newRc.data,
      });
    }
    setNewNumber("");
    setNewRc(null);
    setShowAdd(false);
    toast("Vehicle submitted for verification", {
      description: `${number} (${newType}) was added — its RC document is now in the admin review queue.`,
    });
  };

  const attachDocument = (
    kind: DriverDocumentKind,
    vehicleId: string | undefined,
    sel: PdfSelection | null,
  ) => {
    if (!sel) return;
    addDriverDocument({ kind, vehicleId, fileName: sel.fileName, data: sel.data });
    toast(`${docKindLabels[kind]} submitted`, {
      description: "It will be verified by Kapes before you can use the platform.",
    });
  };

  const viewPdf = (data: string) => {
    window.open(data, "_blank", "noopener");
  };

  const handleRemove = (id: string, number: string) => {
    void removeVehicle(id);
    setRemoveTarget(null);
    toast("Vehicle removed", {
      description: `${number} was removed. Its details and RC document stay archived in the Kapes record for admin review. To use it again, add it once more and await approval.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Kapes<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-accent px-3 py-1 text-sm font-medium sm:inline-flex">
              Account settings
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to={currentUser.role === "driver" ? "/driver" : "/account"}>
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Account settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your profile{isDriver ? " and vehicles" : ""}.
          </p>
        </div>

        {isDriver && currentUser.driverVerification === "pending" ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300">
            <Hourglass className="h-4 w-4 shrink-0" />
            Your identity documents are under review by Kapes admin. You'll be able to
            post trips as soon as they're attested.
          </div>
        ) : null}
        {isDriver && currentUser.driverVerification === "rejected" ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <ShieldX className="h-4 w-4 shrink-0" />
            One or more of your documents were rejected. Upload a clean copy of your
            driving licence and each vehicle's RC to continue.
          </div>
        ) : null}

        <div className="grid items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <ProfilePhoto />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Full name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="settings-name"
                        className="pl-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    {nameTouched && !nameValid && (
                      <p className="text-sm text-destructive">Name must be at least 2 characters.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-phone">Phone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="settings-phone"
                        type="tel"
                        className="pl-9"
                        placeholder="e.g. 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="bg-muted/50 pl-9" value={currentUser.email} readOnly />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile}>Save profile</Button>
                </div>
              </CardContent>
            </Card>

            {isDriver ? (
              <Card className="mt-8 rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          currentUser.driverVerification === "approved" &&
                            "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                          currentUser.driverVerification === "rejected" &&
                            "bg-destructive/10 text-destructive",
                          (!currentUser.driverVerification ||
                            currentUser.driverVerification === "pending") &&
                            "bg-amber-400/15 text-amber-600 dark:bg-teal-400/15 dark:text-teal-300",
                        )}
                      >
                        <IdCard className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-base font-bold">Driver verification</h2>
                        <p className="text-xs text-muted-foreground">
                          Government identity documents attested by Kapes
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        currentUser.driverVerification === "approved" &&
                          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        currentUser.driverVerification === "rejected" &&
                          "bg-destructive/10 text-destructive",
                        (!currentUser.driverVerification ||
                          currentUser.driverVerification === "pending") &&
                          "bg-amber-400/15 text-amber-600 dark:bg-teal-400/15 dark:text-teal-300",
                      )}
                    >
                      {currentUser.driverVerification === "approved" ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified by Kapes
                        </>
                      ) : currentUser.driverVerification === "rejected" ? (
                        <>
                          <ShieldX className="h-3.5 w-3.5" />
                          Documents rejected
                        </>
                      ) : (
                        <>
                          <Hourglass className="h-3.5 w-3.5" />
                          In review
                        </>
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium">
                        {docKindLabels.driving_licence}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {(() => {
                          const dl = findDriverDocument(currentUser, "driving_licence");
                          return dl ? dl.fileName : "Not uploaded";
                        })()}
                      </span>
                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        {(() => {
                          const dl = findDriverDocument(currentUser, "driving_licence");
                          return dl ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => viewPdf(dl.data)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View PDF
                              </Button>
                              <span className="text-xs font-medium text-muted-foreground">
                                {docStatusLabels[dl.status]}
                              </span>
                            </>
                          ) : null;
                        })()}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setLicenceUploading((v) => !v)}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {findDriverDocument(currentUser, "driving_licence")
                            ? "Replace"
                            : "Upload licence"}
                        </Button>
                      </div>
                    </div>
                    {licenceUploading && (
                      <div className="mt-2">
                        <PdfFileInput
                          label="Choose licence PDF"
                          hint="Replaces the current driving licence document."
                          onChange={(sel) => {
                            attachDocument("driving_licence", undefined, sel);
                            if (sel) setLicenceUploading(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Every vehicle you add must carry its RC certificate. Once all your
                    documents are attested you can post trips on the platform.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {isDriver ? (
            <div className="lg:col-span-3">
              <Card className="rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-lg font-bold">My vehicles</h2>
                        <p className="text-sm text-muted-foreground">
                          Add the vehicles you ship with — pick one when posting a trip.
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setShowAdd((v) => !v)}>
                      <Plus className="h-4 w-4" />
                      Add vehicle
                    </Button>
                  </div>

                  {showAdd && (
                    <div className="mb-6 space-y-4 rounded-xl border bg-muted/30 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-vehicle-number">Vehicle number</Label>
                        <div className="relative">
                          <CarFront className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="add-vehicle-number"
                            className="pl-9 uppercase"
                            placeholder="e.g. KA 01 AB 1234"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle type</Label>
                        <TypeButtons value={newType} onChange={setNewType} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vehicle registration — RC (PDF)</Label>
                        <PdfFileInput
                          key={String(showAdd)}
                          onChange={setNewRc}
                          label="Upload vehicle RC"
                          hint={`RC certificate for ${newNumber.trim() || "this vehicle"}, PDF up to 1.5 MB.`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => void handleAddVehicle()}>Add vehicle</Button>
                        <Button variant="ghost" onClick={() => setShowAdd(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {vehicles.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No vehicles yet. Add your first vehicle to start posting trips.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vehicles.map((v) => {
                        const isPrimary = v.id === primary?.id;
                        return (
                          <div
                            key={v.id}
                            className={cn(
                              "rounded-xl border p-4",
                              isPrimary ? "border-primary/40 bg-primary/5" : "bg-card",
                            )}
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CarFront className="h-5 w-5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 font-semibold uppercase tracking-wide">
                                  {v.vehicleNumber}
                                  {isPrimary ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-primary-foreground">
                                      <Star className="h-3 w-3" />
                                      Primary
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {v.vehicleType}
                                  {cargoRoomLabel(v) ? (
                                    <span className="inline-flex items-center gap-1">
                                      {" · "}
                                      <Boxes className="h-3.5 w-3.5" />
                                      {cargoRoomLabel(v)}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {!isPrimary ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void setPrimaryVehicle(v.id)}
                                  >
                                    Set primary
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setRemoveTarget(v)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                                <FileText className="h-4 w-4 shrink-0 text-primary" />
                                <span className="text-xs font-medium">
                                  RC document:{" "}
                                  <span className="text-muted-foreground">
                                    {(() => {
                                      const rcDoc = findDriverDocument(currentUser, "vehicle_rc", v.id);
                                      return rcDoc ? docStatusLabels[rcDoc.status] : "Not uploaded";
                                    })()}
                                  </span>
                                </span>
                                {(() => {
                                  const rcDoc = findDriverDocument(currentUser, "vehicle_rc", v.id);
                                  return (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                        rcDoc?.status === "approved" &&
                                          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                                        rcDoc && rcDoc.status === "pending" &&
                                          "bg-amber-400/15 text-amber-700 dark:bg-teal-400/15 dark:text-teal-300",
                                        (!rcDoc || rcDoc.status === "rejected") &&
                                          "bg-destructive/10 text-destructive",
                                      )}
                                    >
                                      {rcDoc?.status === "approved"
                                        ? "Usable"
                                        : rcDoc?.status === "pending"
                                          ? "Pending admin approval"
                                          : "Can't be used yet"}
                                    </span>
                                  );
                                })()}
                                {(() => {
                                  const rcDoc = findDriverDocument(currentUser, "vehicle_rc", v.id);
                                  return rcDoc ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2.5 text-xs"
                                      onClick={() => viewPdf(rcDoc.data)}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      View PDF
                                    </Button>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>

      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this vehicle?</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.vehicleNumber} (${removeTarget.vehicleType})`
                : "This vehicle"}{" "}
              and its RC document will be taken out of use. The vehicle's details and
              document remain archived in the Kapes record for admin review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:bg-teal-400/10 dark:text-teal-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            To use this vehicle again you must add it afresh with a new RC upload and wait
            for a fresh admin approval.
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() =>
                removeTarget && handleRemove(removeTarget.id, removeTarget.vehicleNumber)
              }
            >
              <Trash2 className="h-4 w-4" />
              Remove vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;