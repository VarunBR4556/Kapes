import { useRef, useState } from "react";
import { FileCheck2, FileUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_PDF_BYTES } from "@/lib/users-store";
import { cn } from "@/lib/utils";

export interface PdfSelection {
  fileName: string;
  data: string;
}

interface PdfFileInputProps {
  onChange: (selection: PdfSelection | null) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const PdfFileInput = ({
  onChange,
  label,
  hint,
  disabled,
  className,
}: PdfFileInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<PdfSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      onChange(null);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF must be under ${(MAX_PDF_BYTES / 1_000_000).toFixed(1)} MB.`);
      onChange(null);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Could not read the PDF \u2014 try again.");
      onChange(null);
    };
    reader.onload = () => {
      const data = reader.result as string;
      setSelection({ fileName: file.name, data });
      onChange({ fileName: file.name, data });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {selection ? (
            <FileCheck2 className="h-4 w-4" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {selection ? "Replace PDF" : label}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
        {selection ? (
          <span className="inline-flex max-w-[16rem] items-center gap-1.5 text-xs text-muted-foreground">
            <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="truncate">{selection.fileName}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default PdfFileInput;