import { Link } from "react-router-dom";
import { Truck, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useUsers } from "@/lib/users-store";

const columns: { title: string; links: { label: string; to?: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us" },
      { label: "Careers" },
      { label: "Blog" },
      { label: "Press" },
      { label: "Contact" },
    ],
  },
  {
    title: "For Drivers",
    links: [
      { label: "Post a trip", to: "/driver" },
      { label: "Driver app" },
      { label: "Earnings" },
      { label: "Driver safety" },
      { label: "Help centre" },
    ],
  },
  {
    title: "For Customers",
    links: [
      { label: "Find capacity", to: "/trips" },
      { label: "Pricing" },
      { label: "Track shipment", to: "/account" },
      { label: "Corporate accounts" },
      { label: "Help centre" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service" },
      { label: "Privacy Policy" },
      { label: "Safety Policy" },
      { label: "Refund Policy" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { label: "Report a bug" },
      { label: "Suggest a feature" },
      { label: "Open source" },
      { label: "Community" },
      { label: "Documentation" },
    ],
  },
];

const socials = [Facebook, Twitter, Instagram, Linkedin];

const Footer = () => {
  const { currentUser } = useUsers();
  const role = currentUser?.role;
  const visibleColumns = columns.filter((col) => {
    if (col.title === "For Drivers") return role !== "customer";
    if (col.title === "For Customers") return role !== "driver";
    return true;
  });

  return (
    <footer id="company" className="scroll-mt-20 border-t bg-muted">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="#top" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Truck className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight">
                Kapes<span className="text-primary">.</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The vehicle capacity marketplace. Turn empty space on the road into
              revenue — and pay only for the space you need.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {visibleColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Kapes. All rights reserved.</p>
          <p>Built to cut empty runs, not corners.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;