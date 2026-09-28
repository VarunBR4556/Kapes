import * as React from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTrips } from "@/lib/trips-store";
import { useUsers, isDriverSearchable } from "@/lib/users-store";
import type { Trip } from "@/lib/trips";
import {
  upcomingTripCities,
  upcomingPickupCities,
  upcomingDropoffCities,
} from "@/lib/search";

function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[] = Array.from({ length: cols }, (_, j) => j);

  for (let i = 1; i < rows; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j < cols; j++) {
      const temp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = temp;
    }
  }
  return dp[cols - 1];
}

interface CityInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
  scope?: "all" | "origin" | "destination";
}

const CityInput = React.forwardRef<HTMLInputElement, CityInputProps>(
  ({ value, onValueChange, className, icon, scope = "all", ...props }, ref) => {
    const { trips } = useTrips();
    const { userById } = useUsers();
    const [open, setOpen] = React.useState(false);
    const [highlight, setHighlight] = React.useState(0);
    const [now, setNow] = React.useState(() => new Date());
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const tick = () => setNow(new Date());
      if (typeof window === "undefined") return;
      const id = window.setInterval(tick, 60_000);
      window.addEventListener("focus", tick);
      return () => {
        window.clearInterval(id);
        window.removeEventListener("focus", tick);
      };
    }, []);

    const include = React.useCallback(
      (t: Trip) => !t.driverId || isDriverSearchable(userById(t.driverId)),
      [userById],
    );

    const cities = React.useMemo(() => {
      if (scope === "origin") return upcomingPickupCities(trips, now, include);
      if (scope === "destination") return upcomingDropoffCities(trips, now, include);
      return upcomingTripCities(trips, now, include);
    }, [trips, now, scope, include]);

    const matches = React.useMemo(() => {
      const q = value.trim().toLowerCase();
      if (!q) return cities.slice(0, 8);

      const scored: { city: string; score: number }[] = [];
      cities.forEach((city) => {
        const c = city.toLowerCase();
        if (c.startsWith(q)) {
          scored.push({ city, score: 0 });
        } else if (c.includes(q)) {
          scored.push({ city, score: 1 });
        } else {
          const dist = editDistance(q, c.slice(0, q.length));
          const tolerance = q.length >= 5 ? 2 : 1;
          if (dist <= tolerance) scored.push({ city, score: 10 + dist });
        }
      });

      return scored
        .sort((a, b) => a.score - b.score || a.city.localeCompare(b.city))
        .slice(0, 8)
        .map((s) => s.city);
    }, [cities, value]);

    React.useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    React.useEffect(() => setHighlight(0), [value]);

    const select = (city: string) => {
      onValueChange(city);
      setOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        setOpen(false);
        return;
      }
      if (!open || matches.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        select(matches[highlight]);
      }
    };

    return (
      <div ref={containerRef} className="relative">
        {icon ?? (
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={ref}
          autoComplete="off"
          className={cn("pl-9", className)}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          {...props}
        />

        {open && matches.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {matches.map((city, i) => (
              <li key={city}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(city);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {city}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
CityInput.displayName = "CityInput";

export { CityInput };
