import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useUsers } from "@/lib/users-store";
import type { DriverVerification, User } from "@/lib/users-store";
import {
  driverDocuments,
  driverRemovedVehicles,
  docKindLabels,
  docStatusLabels,
  userAccountLabel,
} from "@/lib/users-store";
import { useTrips } from "@/lib/trips-store";
import { useReports, issueCategoryLabels, bugCategoryLabels, bugSeverityLabels, bugStatusLabels } from "@/lib/reports-store";
import type { BugStatus } from "@/lib/reports-store";
import { formatDate, timeAgo } from "@/lib/format";
import ThemeToggle from "@/components/theme-toggle";
import UserAvatar from "@/components/profile/UserAvatar";
import ExpandableRow from "@/components/admin/ExpandableRow";
import UserHistory from "@/components/admin/UserHistory";
import DocumentHistory from "@/components/admin/DocumentHistory";
import RejectedDocuments from "@/components/admin/RejectedDocuments";
import ProfileActivity from "@/components/admin/ProfileActivity";
import { ShieldCheck, ShieldAlert, Truck, Package, Bug, AlertTriangle, CheckCircle2, Home, LogOut, Lock, UserCheck, ArrowRight, ClipboardCheck, ExternalLink, IdCard, CarFront, Check, X, Archive, Search, History, ChevronDown, ChevronUp, FileText, FileWarning, UserCog, Users, PauseCircle, MessageSquareWarning, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

const verificationLabels: Record<DriverVerification, string> = {
  pending: "Pending review",
  approved: "Verified",
  rejected: "Rejected",
};

const verificationBadge: Record<DriverVerification, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const GroupDivider = ({ label, count }: { label: string; count: number }) => (
  <div className="flex items-center gap-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    <span>{label}</span>
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{count}</span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

const HistoryButton = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) => (
  <Button
    size="sm"
    variant={active ? "secondary" : "outline"}
    onClick={onClick}
    className="shrink-0"
  >
    {icon}
    {label}
    {active ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
  </Button>
);

const HistorySection = ({
  user,
  onViewData,
  onAttest,
}: {
  user: User;
  onViewData?: (data: string) => void;
  onAttest?: (docId: string, label: string) => void;
}) => {
  const [panel, setPanel] = useState<"activity" | "documents" | "rejected" | "profile" | null>(null);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <HistoryButton
          label="Activity history"
          active={panel === "activity"}
          icon={<History className="h-3.5 w-3.5" />}
          onClick={() => setPanel(panel === "activity" ? null : "activity")}
        />
        {user.role === "driver" && (
          <HistoryButton
            label="Documentation history"
            active={panel === "documents"}
            icon={<FileText className="h-3.5 w-3.5" />}
            onClick={() => setPanel(panel === "documents" ? null : "documents")}
          />
        )}
        {user.role === "driver" && (
          <HistoryButton
            label="Rejected documents"
            active={panel === "rejected"}
            icon={<FileWarning className="h-3.5 w-3.5" />}
            onClick={() => setPanel(panel === "rejected" ? null : "rejected")}
          />
        )}
        <HistoryButton
          label="Profile activity"
          active={panel === "profile"}
          icon={<UserCog className="h-3.5 w-3.5" />}
          onClick={() => setPanel(panel === "profile" ? null : "profile")}
        />
      </div>
      {panel === "activity" && (
        <div className="mt-3">
          <UserHistory user={user} />
        </div>
      )}
      {panel === "documents" && user.role === "driver" && (
        <div className="mt-3">
          <DocumentHistory user={user} />
        </div>
      )}
      {panel === "rejected" && user.role === "driver" && (
        <div className="mt-3">
          <RejectedDocuments user={user} onViewData={onViewData} onAttest={onAttest} />
        </div>
      )}
      {panel === "profile" && (
        <div className="mt-3">
          <ProfileActivity user={user} />
        </div>
      )}
    </div>
  );
};

const AdminLogin = () => {
  const { login } = useUsers();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      toast("Access denied", { description: "These credentials are not recognised." });
      return;
    }
    toast("Signed in");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kapes Admin</h1>
            <p className="text-sm text-muted-foreground">Restricted access. Authorised staff only.</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@kapes.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button size="lg" className="w-full" type="submit">
                <Lock className="h-4 w-4" />
                Sign in to Admin Center
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowRight className="h-3 w-3 rotate-180" />
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { currentUser, users, logout, setDocumentStatus, userById, setAccountFlag } = useUsers();
  const { trips } = useTrips();
  const { issues, resolveTransitIssue, bugs, updateBugStatus } = useReports();

  const [driverQuery, setDriverQuery] = useState("");
  const [issueQuery, setIssueQuery] = useState("");
  const [bugQuery, setBugQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userList, setUserList] = useState<"active" | "blocked">("active");

  const drivers = useMemo(
    () =>
      users
        .filter((u) => u.role === "driver")
        .sort((a, b) => {
          const p = (user: User) => (user.driverVerification ?? "pending") === "pending" ? 0 : 1;
          const pa = p(a);
          if (pa !== p(b)) return pa - p(b);
          return pa === 0
            ? a.createdAt.localeCompare(b.createdAt)
            : lastReviewedAt(b).localeCompare(lastReviewedAt(a));
        }),
    [users],
  );
  const pendingDrivers = drivers.filter((d) => (d.driverVerification ?? "pending") === "pending");
  const openIssues = issues.filter((i) => i.status === "open");
  const openBugs = bugs.filter((b) => b.status !== "fixed");
  const highBugs = bugs.filter((b) => b.severity === "high" && b.status !== "fixed");

  const visibleDrivers = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    return q ? drivers.filter((d) => d.name.toLowerCase().includes(q)) : drivers;
  }, [drivers, driverQuery]);
  const visiblePendingDrivers = visibleDrivers.filter(
    (d) => (d.driverVerification ?? "pending") === "pending",
  );

  const sortedIssues = useMemo(
    () =>
      [...issues].sort((a, b) => {
        const pa = a.status === "open" ? 0 : 1;
        const pb = b.status === "open" ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return pa === 0
          ? a.createdAt.localeCompare(b.createdAt)
          : (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt);
      }),
    [issues],
  );
  const visibleIssues = useMemo(() => {
    const q = issueQuery.trim().toLowerCase();
    return q
      ? sortedIssues.filter((i) => i.reporterName.toLowerCase().includes(q))
      : sortedIssues;
  }, [sortedIssues, issueQuery]);
  const visibleOpenIssues = visibleIssues.filter((i) => i.status === "open");

  const sortedBugs = useMemo(
    () =>
      [...bugs].sort((a, b) => {
        const pa = a.status === "fixed" ? 1 : 0;
        const pb = b.status === "fixed" ? 1 : 0;
        if (pa !== pb) return pa - pb;
        return pa === 0
          ? a.createdAt.localeCompare(b.createdAt)
          : (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);
      }),
    [bugs],
  );
  const visibleBugs = useMemo(() => {
    const q = bugQuery.trim().toLowerCase();
    return q ? sortedBugs.filter((b) => b.reporterName.toLowerCase().includes(q)) : sortedBugs;
  }, [sortedBugs, bugQuery]);
  const visibleOpenBugs = visibleBugs.filter((b) => b.status !== "fixed");

  const visibleUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const rank = (u: User) => (u.blocked ? 0 : u.held ? 1 : u.warned ? 2 : 3);
    return users
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [users, userQuery]);

  if (!currentUser) return <AdminLogin />;

  if (currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-sm rounded-2xl">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <h1 className="text-lg font-bold">Restricted area</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You're signed in as a {currentUser.role}. The Admin Center is only for authorised staff.
            </p>
            <Button className="mt-4" asChild>
              <Link to={currentUser.role === "driver" ? "/driver" : "/account"}>
                Go to my dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approveDoc = (docId: string, label: string) => {
    void setDocumentStatus(docId, "approved");
    toast(`${label} verified`, {
      description: "Document attested. Once every document is verified the driver is cleared to operate.",
    });
  };
  const rejectDoc = (docId: string, label: string) => {
    void setDocumentStatus(docId, "rejected");
    toast(`${label} rejected`, {
      description: "The driver must re-upload a clean copy of this document.",
    });
  };
  const openPdf = (data: string) => {
    window.open(data, "_blank", "noopener");
  };

  const stats = [
    {
      icon: ClipboardCheck,
      label: "Driver reviews pending",
      value: String(pendingDrivers.length),
      accent: "bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950",
    },
    {
      icon: AlertTriangle,
      label: "Open transit issues",
      value: String(openIssues.length),
      accent: "bg-rose-500 text-white",
    },
    {
      icon: Bug,
      label: "Open bug reports",
      value: String(openBugs.length),
      accent: "bg-primary text-primary-foreground",
    },
    {
      icon: ShieldAlert,
      label: "High-severity bugs",
      value: String(highBugs.length),
      accent: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
  ];

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
            <span className="hidden rounded-full bg-accent px-3 py-1 text-sm font-medium sm:inline-flex">
              Admin Center
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Center</h1>
          <p className="mt-1 text-muted-foreground">
            Verify driver authenticity, and review transit issues and bug reports reported by users.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold leading-tight">{stat.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="drivers">
          <TabsList className="flex-wrap">
            <TabsTrigger value="drivers">
              <UserCheck className="h-4 w-4" />
              Driver authenticity
              {pendingDrivers.length > 0 && (
                <Badge variant="warning" className="ml-1">
                  {pendingDrivers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transit">
              <Package className="h-4 w-4" />
              Transit issues
              {openIssues.length > 0 && (
                <Badge variant="danger" className="ml-1">
                  {openIssues.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4" />
              Bug reports
              {highBugs.length > 0 && (
                <Badge variant="danger" className="ml-1">
                  {highBugs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4" />
              All users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <div className="relative mb-3 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={driverQuery}
                onChange={(e) => setDriverQuery(e.target.value)}
                placeholder="Search drivers by name"
                className="pl-9"
              />
            </div>
            <div className="space-y-3">
              {visibleDrivers.map((driver, index) => {
                const status = driver.driverVerification ?? "pending";
                const tripsCount = trips.filter((t) => t.driverId === driver.id).length;
                const issueCount = issues.filter((i) => i.reporterId === driver.id).length;
                const vehicles = driver.vehicles ?? [];
                const docs = driverDocuments(driver);
                const visibleDocs = docs.filter((d) => d.status !== "rejected");
                const rejectedDocs = docs.filter((d) => d.status === "rejected");
                const pendingDocs = visibleDocs.filter((d) => d.status === "pending").length;
                const subject =
                  docs.length === 0
                    ? "No identity documents on file"
                    : pendingDocs > 0
                      ? `${pendingDocs} of ${visibleDocs.length} document${visibleDocs.length === 1 ? "" : "s"} awaiting review`
                      : visibleDocs.length > 0
                        ? `${visibleDocs.length} document${visibleDocs.length === 1 ? "" : "s"} on file`
                        : `${rejectedDocs.length} document${rejectedDocs.length === 1 ? "" : "s"} rejected, awaiting replacement`;
                return (
                  <Fragment key={driver.id}>
                    {index === visiblePendingDrivers.length && (
                      <GroupDivider
                        label="Reviewed"
                        count={visibleDrivers.length - visiblePendingDrivers.length}
                      />
                    )}
                  <ExpandableRow
                    avatar={<UserAvatar name={driver.name} src={driver.profilePic} className="h-11 w-11 text-sm" />}
                    title={
                      <>
                        <h3 className="font-bold">{driver.name}</h3>
                        <Badge variant={verificationBadge[status]}>{verificationLabels[status]}</Badge>
                      </>
                    }
                    subtitle={`${subject} · ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} · ${tripsCount} trips posted · ${issueCount} issue${issueCount === 1 ? "" : "s"} reported`}
                    badges={
                      status === "approved" ? (
                        <Badge variant="success">Cleared to operate</Badge>
                      ) : status === "rejected" ? (
                        <Badge variant="danger">Needs re-upload</Badge>
                      ) : (
                        <Badge variant="warning">Awaiting attestation</Badge>
                      )
                    }
                    meta={
                      status === "pending"
                        ? `Request received ${timeAgo(lastRequestReceivedAt(driver))}`
                        : `Reviewed ${timeAgo(lastReviewedAt(driver))}`
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{driver.email}</span>
                      <span>·</span>
                      <span>{driver.phone ?? "no phone"}</span>
                      {driver.documentsSubmittedAt ? (
                        <>
                          <span>·</span>
                          <span>ID submitted {formatDate(driver.documentsSubmittedAt)}</span>
                        </>
                      ) : null}
                      {primaryVehicleLabel(driver) ? <span>·{primaryVehicleLabel(driver)}</span> : null}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Government documents
                      </p>
                      {visibleDocs.length === 0 ? (
                        <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                          {docs.length === 0
                            ? "No identity documents uploaded yet."
                            : "No documents awaiting review. See rejected documents for details."}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {visibleDocs.map((doc) => {
                            const vehicle = vehicles.find((v) => v.id === doc.vehicleId);
                            const label =
                              doc.kind === "vehicle_rc" && vehicle
                                ? `${docKindLabels[doc.kind]} — ${vehicle.vehicleNumber}`
                                : docKindLabels[doc.kind];
                            return (
                              <li
                                key={doc.id}
                                className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                              >
                                <span
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    doc.kind === "driving_licence"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                                  )}
                                >
                                  {doc.kind === "driving_licence" ? (
                                    <IdCard className="h-4 w-4" />
                                  ) : (
                                    <CarFront className="h-4 w-4" />
                                  )}
                                </span>
                                <div className="min-w-[180px] flex-1">
                                  <p className="text-sm font-medium">{label}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {doc.fileName} · uploaded {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    doc.status === "approved"
                                      ? "success"
                                      : doc.status === "rejected"
                                        ? "danger"
                                        : "warning"
                                  }
                                >
                                  {docStatusLabels[doc.status]}
                                </Badge>
                                {doc.reviewedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(doc.reviewedAt)}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-xs"
                                    title={`Open ${doc.fileName}`}
                                    onClick={() => openPdf(doc.data)}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View PDF
                                  </Button>
                                  {doc.status !== "approved" && (
                                    <Button
                                      size="sm"
                                      className="h-7 px-2.5 text-xs"
                                      onClick={() => approveDoc(doc.id, label)}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Attest
                                    </Button>
                                  )}
                                  {doc.status !== "rejected" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                                      onClick={() => rejectDoc(doc.id, label)}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Attest every document to clear the driver for the platform. Rejecting
                        any document blocks the account until it is replaced.
                      </p>
                    </div>

                    {(() => {
                      const archived = driverRemovedVehicles(driver);
                      if (archived.length === 0) return null;
                      return (
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Archive className="h-3.5 w-3.5" />
                            Archived vehicles (removed by driver)
                          </p>
                          <ul className="space-y-2">
                            {archived.map((rec) => (
                              <li
                                key={`${rec.vehicle.id}-${rec.removedAt}`}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <CarFront className="h-4 w-4" />
                                </span>
                                <div className="min-w-[180px] flex-1">
                                  <p className="text-sm font-semibold uppercase tracking-wide">
                                    {rec.vehicle.vehicleNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {rec.vehicle.vehicleType} · removed {formatDate(rec.removedAt)}
                                  </p>
                                </div>
                                {rec.documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center gap-1.5">
                                    <Badge
                                      variant={
                                        doc.status === "approved"
                                          ? "success"
                                          : doc.status === "rejected"
                                            ? "danger"
                                            : "warning"
                                      }
                                    >
                                      {docStatusLabels[doc.status]}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2.5 text-xs"
                                      title={`Open ${doc.fileName}`}
                                      onClick={() => openPdf(doc.data)}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      View PDF
                                    </Button>
                                  </div>
                                ))}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Removed vehicles stay in the record for audit even though they
                            are no longer usable on the platform.
                          </p>
                        </div>
                      );
                    })()}

                    <HistorySection user={driver} onViewData={openPdf} onAttest={approveDoc} />
                  </ExpandableRow>
                  </Fragment>
                );
              })}
              {visibleDrivers.length === 0 && (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <UserCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    {driverQuery ? "No matching drivers" : "No drivers yet"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {driverQuery
                      ? "No drivers match that name."
                      : "Drivers will appear here once they register."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transit">
            <div className="relative mb-3 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={issueQuery}
                onChange={(e) => setIssueQuery(e.target.value)}
                placeholder="Search issues by reporter name"
                className="pl-9"
              />
            </div>
            <div className="space-y-3">
              {visibleIssues.map((issue, index) => {
                const reporter = userById(issue.reporterId);
                return (
                  <Fragment key={issue.id}>
                    {index === visibleOpenIssues.length && (
                      <GroupDivider
                        label="Resolved"
                        count={visibleIssues.length - visibleOpenIssues.length}
                      />
                    )}
                  <ExpandableRow
                    avatar={
                      <UserAvatar
                        name={issue.reporterName}
                        src={reporter?.profilePic}
                        className="h-11 w-11 text-sm"
                      />
                    }
                    title={
                      <>
                        <h3 className="font-bold">{issue.reporterName}</h3>
                        <Badge variant="muted" className="capitalize">
                          {issue.reporterRole}
                        </Badge>
                      </>
                    }
                    subtitle={`${issueCategoryLabels[issue.category]} · ${issue.origin} → ${issue.destination}`}
                    badges={
                      <Badge variant={issue.status === "open" ? "danger" : "success"}>
                        {issue.status === "open" ? "Open" : "Resolved"}
                      </Badge>
                    }
                    meta={
                      issue.status === "open"
                        ? formatDate(issue.createdAt)
                        : `Resolved ${formatDate(issue.resolvedAt ?? issue.createdAt)}`
                    }
                  >
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={issue.status === "open" ? "warning" : "success"}>
                          {issueCategoryLabels[issue.category]}
                        </Badge>
                        <span>
                          Booking #{issue.bookingId.slice(-4).toUpperCase()} ·{" "}
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {issue.origin} <ArrowRight className="inline h-3.5 w-3.5" /> {issue.destination}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">“{issue.message}”</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {issue.status === "open" ? (
                          <Button
                            size="sm"
                            className="ml-auto"
                            onClick={() => {
                              void resolveTransitIssue(issue.id);
                              toast("Issue resolved", { description: "Marked as resolved." });
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark resolved
                          </Button>
                        ) : issue.resolvedAt ? (
                          <span className="ml-auto">Resolved {formatDate(issue.resolvedAt)}</span>
                        ) : null}
                      </div>
                    </div>

                    {reporter ? (
                      <HistorySection user={reporter} />
                    ) : (
                      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        Reporter account is no longer available.
                      </p>
                    )}
                  </ExpandableRow>
                  </Fragment>
                );
              })}
              {visibleIssues.length === 0 && (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    {issueQuery ? "No matching issues" : "No transit issues reported"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {issueQuery
                      ? "No issues match that reporter name."
                      : "Reports from users will appear here."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bugs">
            <div className="relative mb-3 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={bugQuery}
                onChange={(e) => setBugQuery(e.target.value)}
                placeholder="Search bugs by reporter name"
                className="pl-9"
              />
            </div>
            <div className="space-y-3">
              {visibleBugs.map((bug, index) => {
                const reporter = userById(bug.reporterId);
                return (
                  <Fragment key={bug.id}>
                    {index === visibleOpenBugs.length && (
                      <GroupDivider
                        label="Fixed"
                        count={visibleBugs.length - visibleOpenBugs.length}
                      />
                    )}
                  <ExpandableRow
                    avatar={
                      <UserAvatar
                        name={bug.reporterName}
                        src={reporter?.profilePic}
                        className="h-11 w-11 text-sm"
                      />
                    }
                    title={<h3 className="font-bold">{bug.title}</h3>}
                    subtitle={`${bug.reporterName} · ${bugCategoryLabels[bug.category]}`}
                    badges={
                      <>
                        <Badge
                          variant={
                            bug.severity === "high"
                              ? "danger"
                              : bug.severity === "medium"
                                ? "warning"
                                : "muted"
                          }
                        >
                          {bugSeverityLabels[bug.severity]}
                        </Badge>
                        <Badge
                          variant={
                            bug.status === "fixed"
                              ? "success"
                              : bug.status === "in_progress"
                                ? "info"
                                : "danger"
                          }
                        >
                          {bugStatusLabels[bug.status]}
                        </Badge>
                      </>
                    }
                    meta={
                      bug.status === "fixed"
                        ? `Fixed ${formatDate(bug.updatedAt ?? bug.createdAt)}`
                        : formatDate(bug.createdAt)
                    }
                  >
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge>{bugCategoryLabels[bug.category]}</Badge>
                        <span>Reported {formatDate(bug.createdAt)}</span>
                        {bug.updatedAt ? <span>· Updated {formatDate(bug.updatedAt)}</span> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{bug.description}</p>
                      <div className="mt-3 flex justify-end">
                        <select
                          aria-label="Update bug status"
                          value={bug.status}
                          onChange={(e) => {
                            void updateBugStatus(bug.id, e.target.value as BugStatus);
                            toast("Bug report updated", { description: `Status changed to ${bugStatusLabels[e.target.value as BugStatus]}.` });
                          }}
                          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {Object.entries(bugStatusLabels).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {reporter ? (
                      <HistorySection user={reporter} />
                    ) : (
                      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        Reporter account is no longer available.
                      </p>
                    )}
                  </ExpandableRow>
                  </Fragment>
                );
              })}
              {visibleBugs.length === 0 && (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <Bug className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    {bugQuery ? "No matching bugs" : "No bug reports"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bugQuery
                      ? "No bugs match that reporter name."
                      : "User-submitted bugs will appear here."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative mb-3 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search any user by name or email"
                className="pl-9"
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <HistoryButton
                label={`Active (${visibleUsers.filter((u) => !u.blocked).length})`}
                active={userList === "active"}
                icon={<UserCheck className="h-3.5 w-3.5" />}
                onClick={() => setUserList("active")}
              />
              <HistoryButton
                label={`Blocked (${visibleUsers.filter((u) => u.blocked).length})`}
                active={userList === "blocked"}
                icon={<Ban className="h-3.5 w-3.5" />}
                onClick={() => setUserList("blocked")}
              />
            </div>

            <div className="space-y-3">
              {visibleUsers
                .filter((u) => (userList === "blocked" ? u.blocked : !u.blocked))
                .map((user) => {
                  const vehicles = user.vehicles ?? [];
                  const docs = driverDocuments(user);
                  const userTrips = trips.filter((t) => t.driverId === user.id).length;
                  const userIssues = issues.filter((i) => i.reporterId === user.id).length;
                  const userBugs = bugs.filter((b) => b.reporterId === user.id).length;
                  const pendingDocs = docs.filter((d) => d.status === "pending").length;
                  const accountLabel = userAccountLabel(user);
                  const accountVariant =
                    user.blocked ? "danger" : user.held ? "muted" : user.warned ? "warning" : "success";
                  const subject =
                    user.role === "driver"
                      ? `${pendingDocs > 0 ? `${pendingDocs} of ${docs.length} document${docs.length === 1 ? "" : "s"} awaiting review` : `${docs.length} document${docs.length === 1 ? "" : "s"} on file`} · ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} · ${userTrips} trip${userTrips === 1 ? "" : "s"} posted · ${userIssues} issue${userIssues === 1 ? "" : "s"} reported`
                      : `${userIssues} issue${userIssues === 1 ? "" : "s"} reported · ${userBugs} bug${userBugs === 1 ? "" : "s"} reported`;
                  return (
                    <ExpandableRow
                      key={user.id}
                      avatar={<UserAvatar name={user.name} src={user.profilePic} className="h-11 w-11 text-sm" />}
                      title={
                        <>
                          <h3 className="font-bold">{user.name}</h3>
                          <Badge variant="info">{user.role}</Badge>
                          <Badge variant={accountVariant}>{accountLabel}</Badge>
                        </>
                      }
                      subtitle={subject}
                      badges={
                        user.blocked ? (
                          <Badge variant="danger">Blocked from sign in</Badge>
                        ) : user.held ? (
                          <Badge variant="muted">On hold</Badge>
                        ) : user.warned ? (
                          <Badge variant="warning">Warned</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )
                      }
                      meta={`Joined ${timeAgo(user.createdAt)}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{user.email}</span>
                        <span>·</span>
                        <span>{user.phone ?? "no phone"}</span>
                        <span>·</span>
                        <span>Joined {formatDate(user.createdAt)}</span>
                        {user.role === "driver" && primaryVehicleLabel(user) ? (
                          <span>{primaryVehicleLabel(user)}</span>
                        ) : null}
                      </div>
                      {user.role !== "admin" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant={user.held ? "secondary" : "outline"}
                            className="h-8 px-2.5 text-xs"
                            onClick={() => {
                              setAccountFlag(user.id, "hold", !user.held);
                              toast(user.held ? "Hold lifted" : "Account placed on hold", {
                                description: user.held
                                  ? `${user.name} can sign in again.`
                                  : `${user.name} can no longer sign in until the hold is lifted.`,
                              });
                            }}
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                            {user.held ? "Release hold" : "Hold"}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.warned ? "secondary" : "outline"}
                            className="h-8 px-2.5 text-xs"
                            onClick={() => {
                              setAccountFlag(user.id, "warn", !user.warned);
                              toast(user.warned ? "Warning cleared" : "Account warned", {
                                description: user.warned
                                  ? `Warning removed from ${user.name}.`
                                  : `${user.name} has been issued a warning.`,
                              });
                            }}
                          >
                            <MessageSquareWarning className="h-3.5 w-3.5" />
                            {user.warned ? "Clear warning" : "Warn"}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.blocked ? "secondary" : "outline"}
                            className={cn(
                              "h-8 px-2.5 text-xs",
                              !user.blocked && "text-destructive hover:text-destructive",
                            )}
                            onClick={() => {
                              setAccountFlag(user.id, "block", !user.blocked);
                              toast(user.blocked ? "Account unblocked" : "Account blocked", {
                                description: user.blocked
                                  ? `${user.name} can sign in again.`
                                  : `${user.name} has been permanently blocked from signing in.`,
                              });
                            }}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {user.blocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      )}
                      <HistorySection user={user} onViewData={openPdf} onAttest={approveDoc} />
                    </ExpandableRow>
                  );
                })}
              {visibleUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    {userQuery ? "No matching users" : "No users"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {userQuery
                      ? "No user matches that name or email."
                      : "Registered accounts will appear here."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const primaryVehicleLabel = (driver: User) => {
  const vehicles = driver.vehicles ?? [];
  if (vehicles.length === 0) return "";
  const primary = vehicles.find((v) => v.isPrimary) ?? vehicles[0];
  return ` · ${primary.vehicleNumber} (${primary.vehicleType})`;
};

const lastReviewedAt = (driver: User): string => {
  const reviewed = (driver.documents ?? [])
    .map((d) => d.reviewedAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  return reviewed.length > 0 ? reviewed[reviewed.length - 1] : driver.createdAt;
};

const lastRequestReceivedAt = (driver: User): string => {
  const times = (driver.documents ?? []).map((d) => d.uploadedAt);
  times.push(driver.createdAt);
  times.sort();
  return times[times.length - 1] ?? driver.createdAt;
};

export default AdminDashboard;