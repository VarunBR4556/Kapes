import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TripsProvider } from "@/lib/trips-store";
import { UsersProvider } from "@/lib/users-store";
import { BookingsProvider } from "@/lib/bookings-store";
import { ReportsProvider } from "@/lib/reports-store";
import { AuthProvider } from "@/lib/auth-context";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <UsersProvider>
              <TripsProvider>
                <BookingsProvider>
                  <ReportsProvider>
                    <Toaster />
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </ReportsProvider>
                </BookingsProvider>
              </TripsProvider>
            </UsersProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);