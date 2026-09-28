import { Badge } from "@/components/ui/badge";
import type { User, DriverDocument, DocumentStatus } from "@/lib/users-store";
import { docKindLabels, docStatusLabels } from "@/lib/users-store";
import { formatDate, timeAgo } from "@/lib/format";
import { IdCard, Truck } from "lucide-react";

const docVariant = (status: DocumentStatus): "success" | "danger" | "warning" =>
  status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";

const vehicleNumber = (user: User, doc: DriverDocument): string | undefined => {
  if (doc.kind !== "vehicle_rc" || !doc.vehicleId) return undefined;
  const vehicle = (user.vehicles ?? []).find((v) => v.id === doc.vehicleId);
  return vehicle?.vehicleNumber;
};

const fileKindIcon = (doc: DriverDocument) =>
  doc.kind === "driving_licence" ? (
    <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
  ) : (
    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
  );

const DocumentHistory = ({ user }: { user: User }) => {
  const current = user.documents ?? [];
  const archived = (user.removedVehicles ?? []).flatMap((r) => r.documents);
  const docs = [...current, ...archived].sort((a, b) =>
    (b.reviewedAt ?? b.uploadedAt).localeCompare(a.reviewedAt ?? a.uploadedAt),
  );

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Documentation history
      </p>

      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No identity documents have been submitted by this driver yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => {
            const reviewedAt = doc.reviewedAt ?? doc.uploadedAt;
            return (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs"
              >
                {fileKindIcon(doc)}
                <span className="font-medium">{docKindLabels[doc.kind]}</span>
                {doc.kind === "vehicle_rc" && vehicleNumber(user, doc) ? (
                  <span className="text-muted-foreground">
                    · {vehicleNumber(user, doc)}
                  </span>
                ) : null}
                <span className="truncate text-muted-foreground">{doc.fileName}</span>
                <Badge variant={docVariant(doc.status)}>
                  {docStatusLabels[doc.status]}
                </Badge>
                <span className="ml-auto text-muted-foreground">
                  {doc.status === "pending"
                    ? `Uploaded ${timeAgo(doc.uploadedAt)}`
                    : `Reviewed ${timeAgo(reviewedAt)} · ${formatDate(reviewedAt)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DocumentHistory;