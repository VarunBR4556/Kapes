import type { User } from "./users-store";

const doc = (
  id: string,
  kind: "driving_licence" | "vehicle_rc",
  status: "pending" | "approved" | "rejected",
  vehicleId?: string,
) => ({
  id,
  kind,
  status,
  fileName: `${id}.pdf`,
  data: "",
  uploadedAt: "2026-09-05T08:00:00.000Z",
  vehicleId,
});

/**
 * Fixtures for the node:test suites only. The application ships no seed users;
 * this keeps demo-shaped records out of src runtime code while still letting the
 * QA suite assert on driver-attestation rules.
 */
export const sampleDrivers: User[] = [
  {
    id: "driver-ravi",
    role: "driver",
    name: "Ravi Kumar",
    email: "ravi@kapes.in",
    phone: "9876543210",
    vehicleNumber: "KA 01 AB 1234",
    driverVerification: "approved",
    documentsSubmittedAt: "2026-09-05T08:00:00.000Z",
    documents: [
      doc("ravi-lic", "driving_licence", "approved"),
      doc("ravi-rc-1", "vehicle_rc", "approved", "vehicle-ravi-1"),
    ],
    vehicles: [
      { id: "vehicle-ravi-1", vehicleNumber: "KA 01 AB 1234", vehicleType: "Mini", isPrimary: true },
    ],
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "driver-arjun",
    role: "driver",
    name: "Arjun Mehta",
    email: "arjun@kapes.in",
    phone: "9811122233",
    vehicleNumber: "DL 1C 2233",
    driverVerification: "pending",
    documentsSubmittedAt: "2026-09-14T09:00:00.000Z",
    documents: [
      doc("arjun-lic", "driving_licence", "approved"),
      doc("arjun-rc-1", "vehicle_rc", "pending", "vehicle-arjun-1"),
    ],
    vehicles: [
      { id: "vehicle-arjun-1", vehicleNumber: "DL 1C 2233", vehicleType: "Truck", isPrimary: true },
    ],
    createdAt: "2026-09-01T08:00:00.000Z",
  },
];
