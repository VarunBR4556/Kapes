import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bug } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useReports, bugCategoryLabels, bugSeverityLabels } from "@/lib/reports-store";
import type { BugCategory, BugSeverity } from "@/lib/reports-store";
import { useUsers } from "@/lib/users-store";

const selectorClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ReportBugDialog = () => {
  const { currentUser } = useUsers();
  const { reportBug } = useReports();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<BugCategory>("other");
  const [severity, setSeverity] = useState<BugSeverity>("medium");
  const [description, setDescription] = useState("");

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast("Add the details", { description: "A short title and description are required." });
      return;
    }
    if (!currentUser) return;
    try {
      await reportBug({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send your report.", {
        description: "Nothing was sent. Please try again.",
      });
      return;
    }
    toast("Bug report submitted", {
      description: "Thanks! The team has been notified and will look into it.",
    });
    setOpen(false);
    setTitle("");
    setCategory("other");
    setSeverity("medium");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Bug className="h-4 w-4" />
          Report a bug
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
          <DialogDescription>
            Spotted something wrong? Help us fix the app by describing it below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-title">Short title</Label>
            <Input
              id="bug-title"
              placeholder="e.g. Price resets when I change the date"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bug-category">Area</Label>
              <select
                id="bug-category"
                className={selectorClass}
                value={category}
                onChange={(e) => setCategory(e.target.value as BugCategory)}
              >
                {Object.entries(bugCategoryLabels).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-severity">Severity</Label>
              <select
                id="bug-severity"
                className={selectorClass}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
              >
                {Object.entries(bugSeverityLabels).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-description">What did you see?</Label>
            <Textarea
              id="bug-description"
              rows={4}
              placeholder="Steps to reproduce, what you expected, and what happened…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Bug className="h-4 w-4" />
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportBugDialog;