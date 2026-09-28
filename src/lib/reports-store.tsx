/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export type IssueCategory = "delay" | "damage" | "missing" | "vehicle" | "other";
export type IssueStatus = "open" | "resolved";
export type BugCategory = "ui" | "auth" | "booking" | "tracking" | "other";
export type BugSeverity = "low" | "medium" | "high";
export type BugStatus = "open" | "in_progress" | "fixed";

export interface TransitIssue {
  id: string;
  bookingId: string;
  tripId: string;
  origin: string;
  destination: string;
  reporterId: string;
  reporterName: string;
  reporterRole: "customer" | "driver";
  category: IssueCategory;
  message: string;
  status: IssueStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  status: BugStatus;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt?: string;
}

export const issueCategoryLabels: Record<IssueCategory, string> = {
  delay: "Delay",
  damage: "Damage",
  missing: "Missing cargo",
  vehicle: "Vehicle / breakdown",
  other: "Other",
};

export const bugCategoryLabels: Record<BugCategory, string> = {
  ui: "UI",
  auth: "Login / Signup",
  booking: "Booking",
  tracking: "Tracking",
  other: "Other",
};

export const bugSeverityLabels: Record<BugSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const bugStatusLabels: Record<BugStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  fixed: "Fixed",
};

export const seedTransitIssues: TransitIssue[] = [
  {
    id: "issue-1",
    bookingId: "booking-1",
    tripId: "seed-3",
    origin: "Bengaluru",
    destination: "Chennai",
    reporterId: "customer-asha",
    reporterName: "Asha Nair",
    reporterRole: "customer",
    category: "delay",
    message:
      "Expected pickup yesterday, driver hasn't reached the warehouse yet. Need an update on ETA.",
    status: "open",
    createdAt: "2026-09-18T07:30:00.000Z",
  },
  {
    id: "issue-2",
    bookingId: "booking-2",
    tripId: "seed-17",
    origin: "Bengaluru",
    destination: "Hubballi",
    reporterId: "driver-sneha",
    reporterName: "Sneha Patil",
    reporterRole: "driver",
    category: "vehicle",
    message:
      "Tyre wear flagged during pre-trip inspection. Front left needs replacement before departure.",
    status: "open",
    createdAt: "2026-09-18T09:15:00.000Z",
  },
];

export const seedBugReports: BugReport[] = [
  {
    id: "bug-1",
    title: "Price resets when changing date",
    description:
      "On the trip search page, editing the departure date after loading results resets the entered min weight filter.",
    category: "booking",
    severity: "medium",
    status: "open",
    reporterId: "customer-asha",
    reporterName: "Asha Nair",
    createdAt: "2026-09-17T18:00:00.000Z",
  },
  {
    id: "bug-2",
    title: "Dark mode brand mark hard to see",
    description:
      "The Kapes logo chip on the landing page blends into the dark background; low contrast.",
    category: "ui",
    severity: "low",
    status: "open",
    reporterId: "customer-rahul",
    reporterName: "Rahul Verma",
    createdAt: "2026-09-17T20:12:00.000Z",
  },
];

interface ReportTransitIssueInput {
  bookingId: string;
  tripId: string;
  origin: string;
  destination: string;
  category: IssueCategory;
  message: string;
  reporterId: string;
  reporterName: string;
  reporterRole: "customer" | "driver";
}

interface ReportBugInput {
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  reporterId: string;
  reporterName: string;
}

interface ReportsContextValue {
  issues: TransitIssue[];
  bugs: BugReport[];
  loading: boolean;
  reportTransitIssue: (input: ReportTransitIssueInput) => Promise<TransitIssue | null>;
  resolveTransitIssue: (id: string) => Promise<void>;
  reportBug: (input: ReportBugInput) => Promise<BugReport | null>;
  updateBugStatus: (id: string, status: BugStatus) => Promise<void>;
}

const ReportsContext = createContext<ReportsContextValue | undefined>(undefined);

const mapIssue = (row: Record<string, unknown>): TransitIssue => ({
  id: String(row.id),
  bookingId: String(row.booking_id ?? ""),
  tripId: String(row.trip_id ?? ""),
  origin: String(row.origin ?? ""),
  destination: String(row.destination ?? ""),
  reporterId: String(row.reporter_id ?? ""),
  reporterName: String(row.reporter_name ?? ""),
  reporterRole: (row.reporter_role as "customer" | "driver") ?? "customer",
  category: row.category as IssueCategory,
  message: String(row.message ?? ""),
  status: (row.status as IssueStatus) ?? "open",
  createdAt: String(row.created_at ?? new Date().toISOString()),
  resolvedAt: (row.resolved_at as string | null) ?? undefined,
});

const mapBug = (row: Record<string, unknown>): BugReport => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  description: String(row.description ?? ""),
  category: row.category as BugCategory,
  severity: row.severity as BugSeverity,
  status: row.status as BugStatus,
  reporterId: String(row.reporter_id ?? ""),
  reporterName: String(row.reporter_name ?? ""),
  createdAt: String(row.created_at ?? new Date().toISOString()),
  updatedAt: (row.updated_at as string | null) ?? undefined,
});

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [issues, setIssues] = useState<TransitIssue[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: i }, { data: b }] = await Promise.all([
      supabase.from("transit_issues").select("*").order("created_at", { ascending: false }),
      supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
    ]);
    setIssues((i ?? []).map((r) => mapIssue(r as Record<string, unknown>)));
    setBugs((b ?? []).map((r) => mapBug(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  const reportTransitIssue = useCallback(
    async (input: ReportTransitIssueInput): Promise<TransitIssue | null> => {
      if (!userId) return null;
      const message = input.message.trim();
      if (!message) return null;
      const { data, error } = await supabase
        .from("transit_issues")
        .insert({
          booking_id: input.bookingId,
          trip_id: input.tripId,
          origin: input.origin,
          destination: input.destination,
          reporter_id: userId,
          reporter_name: input.reporterName,
          reporter_role: input.reporterRole,
          category: input.category,
          message,
          status: "open",
        } as unknown as Record<string, never>)
        .select()
        .single();
      if (error || !data) return null;
      const mapped = mapIssue(data as Record<string, unknown>);
      setIssues((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId],
  );

  const resolveTransitIssue = useCallback(async (id: string) => {
    const at = new Date().toISOString();
    await supabase
      .from("transit_issues")
      .update({ status: "resolved", resolved_at: at } as unknown as Record<string, never>)
      .eq("id", id);
    setIssues((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "resolved" as const, resolvedAt: at } : i,
      ),
    );
  }, []);

  const reportBug = useCallback(
    async (input: ReportBugInput): Promise<BugReport | null> => {
      if (!userId) return null;
      const title = input.title.trim();
      const description = input.description.trim();
      if (!title || !description) return null;
      const { data, error } = await supabase
        .from("bug_reports")
        .insert({
          title,
          description,
          category: input.category,
          severity: input.severity,
          status: "open",
          reporter_id: userId,
          reporter_name: input.reporterName,
        } as unknown as Record<string, never>)
        .select()
        .single();
      if (error || !data) return null;
      const mapped = mapBug(data as Record<string, unknown>);
      setBugs((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId],
  );

  const updateBugStatus = useCallback(async (id: string, status: BugStatus) => {
    const at = new Date().toISOString();
    await supabase
      .from("bug_reports")
      .update({ status, updated_at: at } as unknown as Record<string, never>)
      .eq("id", id);
    setBugs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status, updatedAt: at } : b)),
    );
  }, []);

  const value = useMemo(
    () => ({
      issues,
      bugs,
      reportTransitIssue,
      resolveTransitIssue,
      reportBug,
      updateBugStatus,
      loading,
    }),
    [issues, bugs, reportTransitIssue, resolveTransitIssue, reportBug, updateBugStatus, loading],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export function useReports(): ReportsContextValue {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within ReportsProvider");
  }
  return context;
}
