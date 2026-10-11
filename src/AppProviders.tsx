import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TripsProvider } from "@/lib/trips-store";
import { UsersProvider } from "@/lib/users-store";
import { BookingsProvider } from "@/lib/bookings-store";
import { ReportsProvider } from "@/lib/reports-store";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
    <TooltipProvider>
      <AuthProvider>
        <UsersProvider>
          <TripsProvider>
            <BookingsProvider>
              <ReportsProvider>{children}</ReportsProvider>
            </BookingsProvider>
          </TripsProvider>
        </UsersProvider>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
);
