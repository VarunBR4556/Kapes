import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User, DriverDocument } from "@/lib/users-store";
import { docKindLabels, docStatusLabels } from "@/lib/users-store";
import { formatDate, timeAgo } from "@/lib/format";
import { IdCard, Truck, ExternalLink, Check } from "lucide-react";

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

const RejectedDocuments = ({
  user,
  onViewData,
  onAttest,
}: {
  user: User;
  onViewData?: (data: string) => void;
  onAttest?: (docId: string, label: string) => void;
}) => {
  const current = user.documents ?? [];
  const archived = (user.removedVehicles ?? []).flatMap((r) => r.documents);
  const docs = [...current, ...archived]
    .filter((d) => d.status === "rejected")
    .sort((a, b) => (b.reviewedAt ?? b.uploadedAt).localeCompare(a.reviewedAt ?? a.uploadedAt));

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Rejected documents
      </p>

      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No documents have been rejected for this driver.
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
                  <span className="text-muted-foreground">· {vehicleNumber(user, doc)}</span>
                ) : null}
                <span className="truncate text-muted-foreground">{doc.fileName}</span>
                <Badge variant="danger">{docStatusLabels[doc.status]}</Badge>
                <span className="ml-auto text-muted-foreground">
                  Reviewed {timeAgo(reviewedAt)} · {formatDate(reviewedAt)}
                </span>
                {onViewData && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    title={`Open ${doc.fileName}`}
                    onClick={() => onViewData(doc.data)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View PDF
                  </Button>
                )}
                {onAttest && (
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() =>
                      onAttest(
                        doc.id,
                        doc.kind === "vehicle_rc" && vehicleNumber(user, doc)
                          ? `${docKindLabels[doc.kind]} — ${vehicleNumber(user, doc)}`
                          : docKindLabels[doc.kind],
                      )
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RejectedDocuments;