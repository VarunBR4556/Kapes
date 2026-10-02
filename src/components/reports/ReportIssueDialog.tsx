import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useReports, issueCategoryLabels } from "@/lib/reports-store";
import type { IssueCategory } from "@/lib/reports-store";
import { useUsers } from "@/lib/users-store";
import type { Booking } from "@/lib/bookings-store";
import type { Trip } from "@/lib/trips";

const selectorClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ReportIssueDialog = ({
  booking,
  trip,
  reporterRole,
}: {
  booking: Booking;
  trip: Trip;
  reporterRole: "customer" | "driver";
}) => {
  const { currentUser } = useUsers();
  const { reportTransitIssue } = useReports();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<IssueCategory>("delay");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!message.trim()) {
      toast("Describe the issue", { description: "Please add a short description." });
      return;
    }
    if (!currentUser) return;
    try {
      await reportTransitIssue({
        bookingId: booking.id,
        tripId: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        category,
        message: message.trim(),
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reporterRole,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send your report.", {
        description: "Nothing was sent. Please try again.",
      });
      return;
    }
    toast("Issue reported", {
      description: "Our support team has been notified. You can track it in the admin review queue.",
    });
    setOpen(false);
    setMessage("");
    setCategory("delay");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <AlertTriangle className="h-4 w-4" />
          Report an issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a transit issue</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            {trip.origin}
            <ArrowRight className="h-3.5 w-3.5" />
            {trip.destination}
            <span className="ml-1 text-muted-foreground">· Booking #{booking.id.slice(-4).toUpperCase()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-category">Issue type</Label>
            <select
              id="issue-category"
              className={selectorClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
            >
              {Object.entries(issueCategoryLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-message">What happened?</Label>
            <Textarea
              id="issue-message"
              rows={4}
              placeholder="Share the details so our team can help resolve it quickly…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <AlertTriangle className="h-4 w-4" />
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;