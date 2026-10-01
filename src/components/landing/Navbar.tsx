import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Menu, X, LogOut, Sun, Moon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers } from "@/lib/users-store";
import { roleHome } from "@/lib/auth";
import UserAvatar from "@/components/profile/UserAvatar";
import { useTheme } from "next-themes";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Vehicle types", href: "#vehicle-types" },
  { label: "Drivers & customers", href: "#for-you" },
  { label: "Info", href: "#company" },
];

const linkClass =
  "rounded-md px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-manipulation";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useUsers();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const scrolledRef = useRef(false);

  const dashboardHref = currentUser ? roleHome(currentUser.role) : "/login";

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 8;
      if (next !== scrolledRef.current) {
        scrolledRef.current = next;
        setScrolled(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-background",
      )}
    >
      <div className="container flex h-14 items-center justify-between sm:h-16">
        <a
          href="#top"
          className="-ml-1 flex items-center gap-2 rounded-md px-1 py-1 sm:gap-2.5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-9 sm:w-9 sm:rounded-xl">
            <Truck className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </span>
          <span className="text-base font-bold tracking-tight sm:text-xl">
            Kapes<span className="text-primary">.</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={linkClass}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {currentUser ? (
            <>
              <span className="flex items-center gap-2 text-sm">
                <Link
                  to={dashboardHref}
                  aria-label="Go to dashboard"
                  title="Go to dashboard"
                  className="flex items-center gap-2 rounded-full border bg-accent py-1 pl-1 pr-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-accent/70 hover:shadow active:translate-y-px"
                >
                  <UserAvatar
                    name={currentUser.name}
                    src={currentUser.profilePic}
                    className="h-7 w-7 text-xs"
                  />
                  {currentUser.name.split(" ")[0]}
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </span>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-11 w-11 rounded-full active:scale-95"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="h-11 w-11 rounded-full active:scale-95"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <nav className="container divide-y divide-border/60 border-t pb-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-medium text-foreground/90 transition-colors active:bg-accent active:text-foreground"
              >
                {link.label}
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </nav>

          <div className="container pb-4 pt-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardHref}
                  onClick={() => setOpen(false)}
                  aria-label="Go to dashboard"
                  title="Go to dashboard"
                  className="shrink-0 rounded-full active:opacity-80"
                >
                  <UserAvatar
                    name={currentUser.name}
                    src={currentUser.profilePic}
                    className="h-9 w-9 text-xs ring-2 ring-primary/25"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">{currentUser.name}</p>
                  <p className="truncate text-[11px] capitalize text-muted-foreground">
                    {currentUser.role} account
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 px-3"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-10" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button size="sm" className="h-10" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
