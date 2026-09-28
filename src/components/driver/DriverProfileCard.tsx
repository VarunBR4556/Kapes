import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarFront, Settings, Mail, IdCard } from "lucide-react";
import { primaryVehicle, useUsers, driverDocuments } from "@/lib/users-store";
import UserAvatar from "@/components/profile/UserAvatar";

const DriverProfileCard = () => {
  const { currentUser } = useUsers();

  if (!currentUser) return null;

  const primary = primaryVehicle(currentUser);
  const vehiclesCount = currentUser.vehicles?.length ?? 0;

  return (
    <Card className="mb-10 rounded-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={currentUser.name}
              src={currentUser.profilePic}
              className="h-14 w-14 rounded-2xl text-lg"
            />
            <div>
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight">
                {currentUser.name}
                {currentUser.driverVerification === "approved" ? (
                  <Badge variant="success">
                    <IdCard className="mr-1 h-3 w-3" />
                    Verified by Kapes
                  </Badge>
                ) : currentUser.driverVerification === "rejected" ? (
                  <Badge variant="danger">Documents rejected</Badge>
                ) : (
                  <Badge variant="warning">Documents in review</Badge>
                )}
              </h2>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {currentUser.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {driverDocuments(currentUser).length} government document
                {driverDocuments(currentUser).length === 1 ? "" : "s"} on file
              </p>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              Account settings
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-semibold">Contact details</p>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Full name</p>
              <p className="text-sm font-medium">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{currentUser.phone || "Not added"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{currentUser.email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Update your contact details from Account settings.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Primary vehicle</p>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {vehiclesCount} {vehiclesCount === 1 ? "vehicle" : "vehicles"}
              </span>
            </div>
            {primary ? (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CarFront className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold uppercase tracking-wide">{primary.vehicleNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {primary.vehicleType}
                    {vehiclesCount > 1 ? " · switch or add more in settings" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No vehicle added yet. Add one to start posting trips.
              </p>
            )}
            <Button variant="ghost" size="sm" className="mt-3" asChild>
              <Link to="/settings">Manage vehicles</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverProfileCard;
