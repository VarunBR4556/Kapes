import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-teal-400/15 dark:text-teal-300",
        danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
        info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        muted: "bg-muted text-muted-foreground",
        outline: "border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge };