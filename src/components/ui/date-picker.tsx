import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate, toIsoDate } from "@/lib/format";

const parseIso = (iso?: string) =>
  iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : undefined;

export interface DatePickerProps {
  id?: string;
  value?: string;
  onChange?: (date: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}

const DatePicker = ({
  id,
  value,
  onChange,
  min,
  placeholder = "dd/mm/yy",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const minDate = parseIso(min);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label="Pick a date"
          className={cn(
            "relative h-10 w-full justify-start overflow-hidden py-0 pl-9 pr-3 font-normal",
            className,
          )}
        >
          <CalendarDays className="absolute left-3 h-4 w-4 text-muted-foreground" />
          {value ? (
            <span>{formatDate(value)}</span>
          ) : (
            <span className="font-normal text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) onChange?.(toIsoDate(d));
            setOpen(false);
          }}
          disabled={minDate ? { before: minDate } : undefined}
          weekStartsOn={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;