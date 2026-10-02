import { Loader2 } from "lucide-react";

// Shared fallback for lazy routes. Previously these rendered null, which made
// a slow chunk look like a blank page.
const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading" />
  </div>
);

export default PageLoader;