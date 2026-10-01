import type { LucideIcon } from "lucide-react";

type WatermarkProps = {
  icon: LucideIcon;
  className?: string;
};

const Watermark = ({ icon: Icon, className = "" }: WatermarkProps) => (
  <Icon
    aria-hidden="true"
    className={`pointer-events-none absolute select-none text-primary ${className}`}
  />
);

export default Watermark;