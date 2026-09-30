import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Menu, X, LogOut, Sun, Moon } from "lucide-react";
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
  const { currentUser, logout } = useUsers();
  const { theme, setTheme } = useTheme();

  const dashboardHref = currentUser ? roleHome(currentUser.role) : "/login";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="text-lg sm:text-xl font-bold tracking-tight">
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

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "container grid gap-2 border-t py-4 transition-all md:hidden",
          open ? "visible opacity-100" : "invisible h-0 border-t-0 py-0 opacity-0",
        )}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(linkClass, "px-3 py-2.5 text-sm")}
          >
            {link.label}
          </a>
        ))}
        <div className="flex items-center gap-2 px-3 pt-2">
          {currentUser ? (
            <>
              <Link
                to={dashboardHref}
                onClick={() => setOpen(false)}
                aria-label="Go to dashboard"
                title="Go to dashboard"
              >
                <UserAvatar
                  name={currentUser.name}
                  src={currentUser.profilePic}
                  className="h-8 w-8 text-xs ring-2 ring-primary/25"
                />
              </Link>
              <Button
                variant="outline"
                className="flex-1 text-sm"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <Button className="flex-1 text-sm" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in / Sign up
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;