import type { User } from "@/lib/users-store";
import { formatDate, timeAgo } from "@/lib/format";
import { UserPlus, Truck, ArrowRightLeft, PenLine } from "lucide-react";

const actionIcon = (action: string) => {
  if (action.startsWith("Registered")) return <UserPlus className="h-4 w-4" />;
  if (action.startsWith("Set primary")) return <ArrowRightLeft className="h-4 w-4" />;
  if (action.includes("vehicle")) return <Truck className="h-4 w-4" />;
  return <PenLine className="h-4 w-4" />;
};

const ProfileActivity = ({ user }: { user: User }) => {
  const entries = [...(user.profileActivity ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Profile activity
      </p>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No profile updates recorded for this user yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {actionIcon(entry.action)}
              </span>
              <span className="font-medium">{entry.action}</span>
              {entry.detail ? <span className="text-muted-foreground">· {entry.detail}</span> : null}
              <span className="ml-auto text-muted-foreground">
                {timeAgo(entry.createdAt)} · {formatDate(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfileActivity;