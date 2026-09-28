import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Truck, Mail, Lock, User, Phone, Zap, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, type VehicleType } from "@/lib/trips";
import { useUsers } from "@/lib/users-store";
import type { NewDriverDocument, Role } from "@/lib/users-store";
import { roleHome } from "@/lib/auth";
import PdfFileInput from "@/components/driver/PdfFileInput";
import type { PdfSelection } from "@/components/driver/PdfFileInput";

type Mode = "login" | "register";

const Login = () => {
  const { currentUser, login, register } = useUsers();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("Truck");
  const [licence, setLicence] = useState<PdfSelection | null>(null);
  const [rcPdf, setRcPdf] = useState<PdfSelection | null>(null);

  if (currentUser) {
    return <Navigate to={roleHome(currentUser.role)} replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      toast("Login failed", {
        description: "Check your email and password, or sign up for a new account.",
      });
      return;
    }
    toast(`Welcome, ${name.trim().split(" ")[0] || "there"}!`, {
      description: "Signed in successfully.",
    });
    navigate(from ?? "/", { replace: true });
  };

  const handleRegister = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (name.trim().length < 2) {
      toast("Enter your name", { description: "Your full name is required." });
      return;
    }
    if (role === "driver" && !vehicleNumber.trim()) {
      toast("Enter your vehicle number", {
        description: "Drivers need a vehicle number for verification.",
      });
      return;
    }
    if (role === "driver" && !licence) {
      toast("Upload your driving licence", {
        description: "A government-issued licence PDF is required to register as a driver.",
      });
      return;
    }
    if (role === "driver" && !rcPdf) {
      toast("Upload the vehicle registration", {
        description: "An RC PDF for your vehicle is required for verification.",
      });
      return;
    }
    if (password.length < 6) {
      toast("Weak password", { description: "Use at least 6 characters." });
      return;
    }
    const documents: NewDriverDocument[] =
      role === "driver" && licence
        ? [{ kind: "driving_licence", fileName: licence.fileName, data: licence.data }]
        : role === "driver" && rcPdf
          ? [{ kind: "vehicle_rc", fileName: rcPdf.fileName, data: rcPdf.data }]
          : [];
    const ok = await register({
      role,
      name,
      email: cleanEmail,
      password,
      phone: phone || undefined,
      vehicleNumber: role === "driver" ? vehicleNumber : undefined,
      vehicleType,
      documents,
    });
    if (!ok) {
      toast("Could not create account", {
        description: "That email may already be registered, or the password is too weak.",
      });
      return;
    }
    toast(`Account created — welcome, ${name.trim().split(" ")[0] || "there"}!`, {
      description: "Your documents are now in review.",
    });
    navigate(roleHome(role), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            Kapes<span className="text-primary">.</span>
          </span>
        </Link>

        <Card className="rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Sign in to Kapes" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Access your driver or customer dashboard."
                  : "Join as a driver or a customer."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md py-2 text-sm font-semibold transition-colors",
                    mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {mode === "register" && (
              <div className="mb-5">
                <Label className="mb-2 block">I am a…</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["customer", "driver"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={mode === "login" ? handleLogin : handleRegister}
              className="space-y-4"
            >
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="e.g. Ravi Kumar"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {mode === "register" && (
                <>
                  {role === "driver" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="reg-vehicle">Vehicle number</Label>
                        <div className="relative">
                          <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-vehicle"
                            placeholder="e.g. KA 01 AB 1234"
                            className="pl-9 uppercase"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle type</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {VEHICLE_TYPES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setVehicleType(t)}
                              className={cn(
                                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                vehicleType === t
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "hover:bg-accent",
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Driving licence (PDF)</Label>
                        <PdfFileInput
                          onChange={setLicence}
                          label="Upload driving licence"
                          hint="Government-issued licence, PDF up to 1.5 MB."
                        />
                        {!licence && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            Attestation requires a driving licence PDF.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vehicle registration — RC (PDF)</Label>
                        <PdfFileInput
                          onChange={setRcPdf}
                          label="Upload vehicle RC"
                          hint={`Registration certificate for ${vehicleNumber.trim() || "this vehicle"}, PDF up to 1.5 MB.`}
                        />
                        {!rcPdf && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            Attestation requires the vehicle RC PDF.
                          </p>
                        )}
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone (optional)</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="e.g. 98765 43210"
                        className="pl-9"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button size="lg" className="w-full" type="submit">
                {mode === "login" ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Sign in
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Create account
                  </>
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              New here? Create an account as a driver or customer. Driver accounts need a
              vehicle number plus licence and RC PDFs before they can list trips.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;