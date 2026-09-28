import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import RequireRole from "./components/auth/RequireRole";
import ScrollToTop from "./components/ScrollToTop";

const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Trips = lazy(() => import("./pages/Trips"));
const BookPage = lazy(() => import("./pages/BookPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const App = () => {
  return (
    <Suspense fallback={null}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/trips" element={<Trips />} />
        <Route
          path="/settings"
          element={
            <RequireRole>
              <Settings />
            </RequireRole>
          }
        />
        <Route
          path="/book/:tripId"
          element={
            <RequireRole role="customer">
              <BookPage />
            </RequireRole>
          }
        />
        <Route
          path="/account"
          element={
            <RequireRole role="customer">
              <CustomerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/driver"
          element={
            <RequireRole role="driver">
              <DriverDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;