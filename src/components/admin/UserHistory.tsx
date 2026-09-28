import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useTrips } from "@/lib/trips-store";
import { useBookings, bookingStatusLabels } from "@/lib/bookings-store";
import {
  useReports,
  issueCategoryLabels,
  bugSeverityLabels,
  bugStatusLabels,
} from "@/lib/reports-store";
import { tripStatusLabels } from "@/lib/trips";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/users-store";
import { ArrowRight, Package, Bug, Route, Wallet } from "lucide-react";

const Section = ({
  icon,
  title,
  count,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  children: ReactNode;
}) => (
  <div>
    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {title}
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
        {count}
      </span>
    </p>
    <ul className="space-y-1.5">{children}</ul>
  </div>
);

const Row = ({ children }: { children: ReactNode }) => (
  <li className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
    {children}
  </li>
);

const statusVariant = (status: string) =>
  status === "completed" || status === "delivered" || status === "fixed" || status === "resolved"
    ? "success"
    : status === "cancelled" || status === "rejected"
      ? "danger"
      : status === "in_transit" || status === "in_progress"
        ? "info"
        : "warning";

const UserHistory = ({ user }: { user: User }) => {
  const { trips } = useTrips();
  const { bookings } = useBookings();
  const { issues, bugs } = useReports();

  const userTrips = trips
    .filter((t) => t.driverId === user.id)
    .sort((a, b) => b.departureDate.localeCompare(a.departureDate));
  const userBookings = bookings
    .filter((b) => b.customerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const userIssues = issues
    .filter((i) => i.reporterId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const userBugs = bugs
    .filter((b) => b.reporterId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const nothing =
    userTrips.length === 0 &&
    userBookings.length === 0 &&
    userIssues.length === 0 &&
    userBugs.length === 0;

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Full activity history
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="muted" className="capitalize">
          {user.role}
        </Badge>
        <span>{user.email}</span>
        <span>·</span>
        <span>{user.phone ?? "no phone"}</span>
        <span>·</span>
        <span>Joined {formatDate(user.createdAt)}</span>
      </div>

      {nothing ? (
        <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No platform activity recorded for this user yet.
        </p>
      ) : (
        <div className="space-y-4">
          {userTrips.length > 0 && (
            <Section icon={<Route className="h-3.5 w-3.5" />} title="Trips posted" count={userTrips.length}>
              {userTrips.map((t) => (
                <Row key={t.id}>
                  <span className="font-medium">
                    {t.origin} <ArrowRight className="inline h-3 w-3" /> {t.destination}
                  </span>
                  <span className="text-muted-foreground">{formatDate(t.departureDate)}</span>
                  <span className="ml-auto capitalize text-muted-foreground">
                    {t.vehicleType}
                  </span>
                  <Badge variant={statusVariant(t.status)}>{tripStatusLabels[t.status]}</Badge>
                </Row>
              ))}
            </Section>
          )}

          {userBookings.length > 0 && (
            <Section icon={<Wallet className="h-3.5 w-3.5" />} title="Bookings made" count={userBookings.length}>
              {userBookings.map((b) => {
                const trip = trips.find((t) => t.id === b.tripId);
                return (
                  <Row key={b.id}>
                    <span className="font-medium">
                      {trip ? (
                        <>
                          {trip.origin} <ArrowRight className="inline h-3 w-3" /> {trip.destination}
                        </>
                      ) : (
                        "Trip removed"
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {b.shipmentWeightKg} kg · ₹{b.totalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className={cn("ml-auto text-muted-foreground")}>
                      {formatDate(b.createdAt)}
                    </span>
                    <Badge variant={statusVariant(b.status)}>{bookingStatusLabels[b.status]}</Badge>
                  </Row>
                );
              })}
            </Section>
          )}

          {userIssues.length > 0 && (
            <Section
              icon={<Package className="h-3.5 w-3.5" />}
              title="Transit issues reported"
              count={userIssues.length}
            >
              {userIssues.map((i) => (
                <Row key={i.id}>
                  <Badge variant={statusVariant(i.status)}>{issueCategoryLabels[i.category]}</Badge>
                  <span className="font-medium">
                    {i.origin} <ArrowRight className="inline h-3 w-3" /> {i.destination}
                  </span>
                  <span className="ml-auto text-muted-foreground">{formatDate(i.createdAt)}</span>
                </Row>
              ))}
            </Section>
          )}

          {userBugs.length > 0 && (
            <Section icon={<Bug className="h-3.5 w-3.5" />} title="Bug reports" count={userBugs.length}>
              {userBugs.map((b) => (
                <Row key={b.id}>
                  <Badge variant={b.severity === "high" ? "danger" : b.severity === "medium" ? "warning" : "muted"}>
                    {bugSeverityLabels[b.severity]}
                  </Badge>
                  <span className="font-medium">{b.title}</span>
                  <span className="ml-auto text-muted-foreground">{formatDate(b.createdAt)}</span>
                  <Badge variant={b.status === "fixed" ? "success" : b.status === "in_progress" ? "info" : "danger"}>
                    {bugStatusLabels[b.status]}
                  </Badge>
                </Row>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

export default UserHistory;
