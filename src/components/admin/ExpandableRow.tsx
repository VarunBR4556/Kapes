import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableRowProps {
  avatar: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

const ExpandableRow = ({
  avatar,
  title,
  subtitle,
  badges,
  meta,
  defaultOpen = false,
  children,
}: ExpandableRowProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-colors",
        open && "border-primary/40",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50"
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {badges ? <div className="flex shrink-0 flex-wrap items-center gap-1.5">{badges}</div> : null}
        {meta ? (
          <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">{meta}</div>
        ) : null}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="space-y-4 border-t p-4 sm:p-5">{children}</div> : null}
    </div>
  );
};

export default ExpandableRow;
