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
    <footer id="company" className="scroll-mt-16 border-t bg-muted sm:scroll-mt-20">
      <div className="container py-6 sm:py-10 lg:py-14">
        <div className="lg:grid lg:gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="#top" className="flex items-center gap-2 sm:gap-2.5">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                Kapes<span className="text-primary">.</span>
              </span>
            </a>
            <p className="mt-2 max-w-xs text-[10px] sm:text-xs text-muted-foreground">
              The vehicle capacity marketplace. Turn empty space on the road into
              revenue — and pay only for the space you need.
            </p>
            <div className="mt-3 flex items-center gap-1 sm:gap-1.5">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="flex h-7 w-7 sm:h-8 sm:w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="-mx-8 mt-5 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-pl-8 sm:-mx-0 sm:mt-0 sm:contents sm:overflow-visible sm:px-0 sm:scroll-pl-0">
          {visibleColumns.map((col) => (
            <div
              key={col.title}
              className="w-[42%] shrink-0 snap-start sm:w-auto sm:shrink lg:w-auto"
            >
              <h4 className="mb-1.5 text-[10px] sm:mb-2 sm:text-xs font-bold uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-[10px] sm:text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="text-[10px] sm:text-xs text-muted-foreground transition-colors hover:text-foreground"
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
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-1 py-3 text-[10px] sm:text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Kapes. All rights reserved.</p>
          <p>Built to cut empty runs, not corners.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;