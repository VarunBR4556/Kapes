/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, DOCUMENT_BUCKET, AVATAR_BUCKET, avatarPath, documentPath } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { VehicleType } from "./trips";
import { defaultCargoRoom } from "./trips";

export type Role = "driver" | "customer" | "admin";

export type DriverVerification = "pending" | "approved" | "rejected";

export type DriverDocumentKind = "driving_licence" | "vehicle_rc";
export type DocumentStatus = "pending" | "approved" | "rejected";

export interface DriverDocument {
  id: string;
  kind: DriverDocumentKind;
  fileName: string;
  data: string;
  status: DocumentStatus;
  vehicleId?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface NewDriverDocument {
  kind: DriverDocumentKind;
  vehicleId?: string;
  fileName: string;
  data: string;
}

export const MAX_PDF_BYTES = 1_500_000;

export const docKindLabels: Record<DriverDocumentKind, string> = {
  driving_licence: "Driving licence",
  vehicle_rc: "Vehicle registration (RC)",
};

export const docStatusLabels: Record<DocumentStatus, string> = {
  pending: "In review",
  approved: "Verified",
  rejected: "Rejected",
};

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  isPrimary?: boolean;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface RemovedVehicleRecord {
  removedAt: string;
  vehicle: Vehicle;
  documents: DriverDocument[];
}

export interface ProfileActivityEntry {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profilePic?: string;
  vehicleNumber?: string;
  vehicles?: Vehicle[];
  removedVehicles?: RemovedVehicleRecord[];
  driverVerification?: DriverVerification;
  documentsSubmittedAt?: string;
  documents?: DriverDocument[];
  profileActivity?: ProfileActivityEntry[];
  held?: boolean;
  heldAt?: string;
  warned?: boolean;
  warnedAt?: string;
  blocked?: boolean;
  blockedAt?: string;
  createdAt: string;
}

export interface RegisterInput {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  documents?: NewDriverDocument[];
}

const withVehicleRoom = (v: Vehicle): Vehicle => ({
  ...defaultCargoRoom(v.vehicleType),
  ...v,
});

export const driverDocuments = (user?: User | null): DriverDocument[] =>
  user?.documents ?? [];

export const findDriverDocument = (
  user?: User | null,
  kind?: DriverDocumentKind,
  vehicleId?: string,
): DriverDocument | undefined =>
  driverDocuments(user).find(
    (d) =>
      (!kind || d.kind === kind) &&
      (!vehicleId || vehicleId === d.vehicleId || d.vehicleId === undefined),
  );

export const isVehicleApproved = (
  user?: User | null,
  vehicleId?: string,
): boolean => {
  if (user?.role !== "driver" || !vehicleId) return false;
  const doc = driverDocuments(user).find(
    (d) => d.kind === "vehicle_rc" && d.vehicleId === vehicleId,
  );
  return doc?.status === "approved";
};

export const approvedVehicles = (user?: User | null): Vehicle[] =>
  (user?.vehicles ?? []).filter((v) => isVehicleApproved(user, v.id));

export const isDriverSearchable = (user?: User | null): boolean =>
  user?.role === "driver" &&
  (user.documents ?? []).length > 0 &&
  (user.documents ?? []).every((d) => d.status === "approved");

export const driverRemovedVehicles = (user?: User | null): RemovedVehicleRecord[] =>
  user?.removedVehicles ?? [];

export const userAccountLabel = (user?: User | null): string => {
  if (user?.blocked) return "Blocked";
  if (user?.held) return "On hold";
  if (user?.warned) return "Warned";
  return "Active";
};

export const primaryVehicle = (user?: User | null): Vehicle | undefined => {
  const vehicles = user?.vehicles ?? [];
  return vehicles.find((v) => v.isPrimary) ?? vehicles[0];
};

const syncVehicleNumber = (vehicles: Vehicle[]) => {
  const primary = vehicles.find((v) => v.isPrimary) ?? vehicles[0];
  return primary?.vehicleNumber ?? undefined;
};

const verificationFromDocs = (docs: DriverDocument[]): DriverVerification | undefined => {
  if (docs.length === 0) return "pending";
  if (docs.some((d) => d.status === "rejected")) return "rejected";
  if (docs.every((d) => d.status === "approved")) return "approved";
  return "pending";
};

const stripDataUrl = (dataUrl: string) => dataUrl.replace(/^data:[^;]+;base64,/, "");

const docMime = (fileName: string) =>
  /\.pdf$/i.test(fileName) ? "application/pdf" : "application/octet-stream";

const mapVehicle = (row: Record<string, unknown>): Vehicle =>
  withVehicleRoom({
    id: String(row.id),
    vehicleNumber: String(row.vehicle_number ?? ""),
    vehicleType: row.vehicle_type as VehicleType,
    isPrimary: Boolean(row.is_primary),
    lengthCm: (row.length_cm as number | null) ?? undefined,
    breadthCm: (row.breadth_cm as number | null) ?? undefined,
    heightCm: (row.height_cm as number | null) ?? undefined,
  });

const mapDocument = (row: Record<string, unknown>): DriverDocument => ({
  id: String(row.id),
  kind: row.kind as DriverDocumentKind,
  fileName: String(row.file_name ?? ""),
  data: String(row.file_path ?? ""),
  status: row.status as DocumentStatus,
  vehicleId: (row.vehicle_id as string | null) ?? undefined,
  uploadedAt: String(row.uploaded_at ?? new Date().toISOString()),
  reviewedAt: (row.reviewed_at as string | null) ?? undefined,
});

const mapActivity = (row: Record<string, unknown>): ProfileActivityEntry => ({
  id: String(row.id),
  action: String(row.action ?? ""),
  detail: (row.detail as string | null) ?? undefined,
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

const mapProfile = (
  row: Record<string, unknown>,
  email: string,
  vehicles: Vehicle[],
  documents: DriverDocument[],
  removed: RemovedVehicleRecord[],
  activity: ProfileActivityEntry[],
): User => {
  const docs = [...documents];
  return {
    id: String(row.id),
    role: (row.role as Role) ?? "customer",
    name: String(row.name ?? ""),
    email,
    phone: (row.phone as string | null) ?? undefined,
    profilePic: (row.profile_pic as string | null) ?? undefined,
    vehicles,
    removedVehicles: removed,
    vehicleNumber: syncVehicleNumber(vehicles),
    driverVerification: (row.driver_verification as DriverVerification | null) ?? verificationFromDocs(docs),
    documentsSubmittedAt: (row.documents_submitted_at as string | null) ?? undefined,
    documents: docs,
    profileActivity: activity,
    held: Boolean(row.held),
    heldAt: (row.held_at as string | null) ?? undefined,
    warned: Boolean(row.warned),
    warnedAt: (row.warned_at as string | null) ?? undefined,
    blocked: Boolean(row.blocked),
    blockedAt: (row.blocked_at as string | null) ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
};

const logActivity = async (userId: string, action: string, detail?: string) => {
  await supabase.from("profile_activity").insert({ user_id: userId, action, detail });
};

const loadUserBundle = async (id: string, email: string, role: Role) => {
  const [{ data: profileRow }, { data: vehicles }, { data: docs }, { data: activity }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("vehicles").select("*").eq("user_id", id).order("created_at"),
      supabase.from("driver_documents").select("*").eq("user_id", id).order("uploaded_at"),
      supabase
        .from("profile_activity")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (!profileRow) return null;

  const mapped = (vehicles ?? []).map((v) => mapVehicle(v as Record<string, unknown>));
  const live = mapped.filter((v) => !v.id.startsWith("removed:"));
  const removedIds = new Set(
    (vehicles ?? [])
      .filter((v) => (v as Record<string, unknown>).removed_at)
      .map((v) => String((v as Record<string, unknown>).id)),
  );
  const mappedDocs = (docs ?? []).map((d) => mapDocument(d as Record<string, unknown>));
  const removed: RemovedVehicleRecord[] = mapped
    .filter((v) => removedIds.has(v.id))
    .map((v) => ({
      removedAt: new Date().toISOString(),
      vehicle: v,
      documents: mappedDocs.filter((d) => d.vehicleId === v.id),
    }));

  void role;
  return mapProfile(
    profileRow as Record<string, unknown>,
    email,
    live,
    mappedDocs,
    removed,
    (activity ?? []).map((a) => mapActivity(a as Record<string, unknown>)),
  );
};

const directoryUser = (row: Record<string, unknown>): User => {
  const searchable = Boolean(row.searchable);
  const vehicle = (row.vehicle ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    role: "driver",
    name: String(row.name ?? ""),
    email: "",
    driverVerification: (row.driver_verification as DriverVerification | null) ?? undefined,
    documents: searchable
      ? [
          {
            id: "public-approved",
            kind: "driving_licence",
            fileName: "",
            data: "",
            status: "approved",
            uploadedAt: "",
          },
        ]
      : [],
    vehicles: vehicle.vehicleNumber
      ? [
          withVehicleRoom({
            id: `public-${String(row.id)}`,
            vehicleNumber: String(vehicle.vehicleNumber),
            vehicleType: vehicle.vehicleType as VehicleType,
            isPrimary: Boolean(vehicle.isPrimary),
          }),
        ]
      : [],
    createdAt: "",
  };
};

interface UsersContextValue {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<Omit<User, "id" | "role" | "email">>) => Promise<void>;
  userById: (id?: string) => User | undefined;
  addVehicle: (input: { vehicleNumber: string; vehicleType: VehicleType }) => Promise<Vehicle | null>;
  updateVehicle: (id: string, patch: Partial<Omit<Vehicle, "id">>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  setPrimaryVehicle: (id: string) => Promise<void>;
  setDriverVerification: (userId: string, status: DriverVerification) => Promise<void>;
  addDriverDocument: (input: NewDriverDocument) => Promise<void>;
  setDocumentStatus: (docId: string, status: DocumentStatus) => Promise<void>;
  setAccountFlag: (userId: string, flag: "hold" | "warn" | "block", on: boolean) => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [directory, setDirectory] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;
  const role = profile?.role ?? null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // The driver directory and the signed-in user's own bundle do not depend on
    // each other, so fetch them together instead of in series.
    const [driversRes, self] = await Promise.all([
      supabase.from("public_drivers").select("*"),
      loadUserBundle(userId, user?.email ?? "", role ?? "customer"),
    ]);

    const dir: Record<string, User> = {};
    (driversRes.data ?? []).forEach((d) => {
      const u = directoryUser(d as Record<string, unknown>);
      dir[u.id] = u;
    });
    setDirectory(dir);

    if (!self) {
      setUsers([]);
      setLoading(false);
      return;
    }

    if (role === "admin") {
      const { data: allProfiles } = await supabase.from("profiles").select("*");
      const ids = (allProfiles ?? []).map((p) => String((p as Record<string, unknown>).id));
      const [{ data: vs }, { data: ds }, { data: acts }] = await Promise.all([
        supabase.from("vehicles").select("*").in("user_id", ids),
        supabase.from("driver_documents").select("*").in("user_id", ids),
        supabase.from("profile_activity").select("*").in("user_id", ids).limit(500),
      ]);
      const merged = (allProfiles ?? []).map((p) => {
        const prow = p as Record<string, unknown>;
        const pid = String(prow.id);
        const pvs = (vs ?? [])
          .filter((v) => (v as Record<string, unknown>).user_id === pid)
          .map((v) => mapVehicle(v as Record<string, unknown>));
        const pds = (ds ?? [])
          .filter((d) => (d as Record<string, unknown>).user_id === pid)
          .map((d) => mapDocument(d as Record<string, unknown>));
        const pacs = (acts ?? [])
          .filter((a) => (a as Record<string, unknown>).user_id === pid)
          .map((a) => mapActivity(a as Record<string, unknown>));
        return mapProfile(prow, pid === self.id ? self.email : "", pvs, pds, [], pacs);
      });
      setUsers(merged);
    } else {
      setUsers([self]);
    }
    setLoading(false);
  }, [userId, user?.email, role]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  );

  const userById = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      return users.find((u) => u.id === id) ?? directory[id];
    },
    [users, directory],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await signIn(email, password);
      return !error;
    },
    [signIn],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const { error, needsConfirmation } = await signUp({
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role === "admin" ? "customer" : input.role,
    });
    if (error) return false;
    if (needsConfirmation) return true;

    const { data: sess } = await supabase.auth.getSession();
    const newId = sess.session?.user.id;
    if (!newId) return true;

    if (input.role === "driver" && input.vehicleNumber) {
      const room = defaultCargoRoom(input.vehicleType ?? "Mini");
      await supabase.from("vehicles").insert({
        user_id: newId,
        vehicle_number: input.vehicleNumber.trim().toUpperCase(),
        vehicle_type: input.vehicleType ?? "Mini",
        is_primary: true,
        length_cm: room.lengthCm,
        breadth_cm: room.breadthCm,
        height_cm: room.heightCm,
      } as unknown as Record<string, never>);
    }

    if (input.phone) {
      await supabase
        .from("profiles")
        .update({ phone: input.phone } as unknown as Record<string, never>)
        .eq("id", newId);
    }

    for (const doc of input.documents ?? []) {
      const { data: vs } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", newId)
        .is("removed_at", null)
        .order("created_at")
        .limit(1);
      const path = documentPath(newId, doc.fileName);
      const { error: upErr } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, stripDataUrl(doc.data), {
          contentType: docMime(doc.fileName),
          upsert: false,
        });
      if (upErr) continue;
      await supabase.from("driver_documents").insert({
        user_id: newId,
        vehicle_id: doc.vehicleId ?? (vs?.[0]?.id as string | undefined) ?? null,
        kind: doc.kind,
        file_name: doc.fileName,
        file_path: path,
        status: "pending",
      } as unknown as Record<string, never>);
    }

    if ((input.documents ?? []).length > 0) {
      await supabase
        .from("profiles")
        .update({ documents_submitted_at: new Date().toISOString() } as unknown as Record<string, never>)
        .eq("id", newId);
    }
    return true;
  }, [signUp]);

  const logout = useCallback(async () => {
    await signOut();
    setUsers([]);
  }, [signOut]);

  const updateUser = useCallback(
    async (patch: Partial<Omit<User, "id" | "role" | "email">>) => {
      if (!userId) return;
      const at = new Date().toISOString();
      const row: Record<string, unknown> = {};

      if (patch.name !== undefined) {
        row.name = patch.name;
        logActivity(userId, "Updated name", "Now " + patch.name, );
      }
      if (patch.phone !== undefined) {
        row.phone = patch.phone || null;
        void logActivity(
          userId,
          patch.phone ? "Updated phone number" : "Removed phone number",
          patch.phone || undefined,
        );
      }
      if ("profilePic" in patch) {
        if (patch.profilePic) {
          const path = avatarPath(userId, `avatar`);
          const { error } = await supabase.storage
            .from(AVATAR_BUCKET)
            .upload(path, stripDataUrl(patch.profilePic), { contentType: "image/jpeg", upsert: true });
          if (!error) row.profile_pic = path;
        } else {
          row.profile_pic = null;
        }
        void logActivity(userId, patch.profilePic ? "Updated profile picture" : "Removed profile picture");
      }

      if (Object.keys(row).length > 0) {
        await supabase.from("profiles").update(row).eq("id", userId);
      }
      void at;
      await refresh();
    },
    [userId, refresh],
  );

  const addVehicle = useCallback(
    async (input: { vehicleNumber: string; vehicleType: VehicleType }) => {
      if (!userId || role !== "driver") return null;
      const number = input.vehicleNumber.trim().toUpperCase();
      if (!number) return null;
      const room = defaultCargoRoom(input.vehicleType);
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          user_id: userId,
          vehicle_number: number,
          vehicle_type: input.vehicleType,
          is_primary: (currentUser?.vehicles?.length ?? 0) === 0,
          length_cm: room.lengthCm,
          breadth_cm: room.breadthCm,
          height_cm: room.heightCm,
        } as unknown as Record<string, never>)
        .select()
        .single();
      if (error || !data) return null;
      await logActivity(userId, "Added vehicle", `${number} (${input.vehicleType})`);
      await refresh();
      return mapVehicle(data as Record<string, unknown>);
    },
    [userId, role, currentUser, refresh],
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<Omit<Vehicle, "id">>) => {
      if (!userId) return;
      const row: Record<string, unknown> = {};
      if (patch.vehicleNumber !== undefined) {
        row.vehicle_number = patch.vehicleNumber.trim().toUpperCase();
      }
      if (patch.isPrimary !== undefined) row.is_primary = patch.isPrimary;
      if (patch.vehicleType !== undefined) {
        row.vehicle_type = patch.vehicleType;
        const room = defaultCargoRoom(patch.vehicleType);
        row.length_cm = room.lengthCm;
        row.breadth_cm = room.breadthCm;
        row.height_cm = room.heightCm;
      }
      await supabase.from("vehicles").update(row as unknown as Record<string, never>).eq("id", id);
      await logActivity(userId, "Updated vehicle", String(patch.vehicleNumber ?? ""));
      await refresh();
    },
    [userId, refresh],
  );

  const setPrimaryVehicle = useCallback(
    async (id: string) => {
      if (!userId) return;
      const { data: mine } = await supabase.from("vehicles").select("id").eq("user_id", userId);
      const ids = (mine ?? []).map((v) => String((v as Record<string, unknown>).id));
      await Promise.all(
        ids.map((vid) =>
          supabase
            .from("vehicles")
            .update({ is_primary: vid === id } as unknown as Record<string, never>)
            .eq("id", vid),
        ),
      );
      await logActivity(userId, "Set primary vehicle", id);
      await refresh();
    },
    [userId, refresh],
  );

  const removeVehicle = useCallback(
    async (id: string) => {
      if (!userId) return;
      const target = currentUser?.vehicles?.find((v) => v.id === id);
      await supabase
        .from("vehicles")
        .update({ removed_at: new Date().toISOString(), is_primary: false } as unknown as Record<string, never>)
        .eq("id", id);
      await supabase
        .from("driver_documents")
        .update({ vehicle_id: null } as unknown as Record<string, never>)
        .eq("vehicle_id", id);
      if (target) await logActivity(userId, "Removed vehicle", target.vehicleNumber);
      await refresh();
    },
    [userId, currentUser, refresh],
  );

  const setDriverVerification = useCallback(
    async (userId2: string, status: DriverVerification) => {
      await supabase
        .from("profiles")
        .update({ driver_verification: status } as unknown as Record<string, never>)
        .eq("id", userId2);
      await refresh();
    },
    [refresh],
  );

  const addDriverDocument = useCallback(
    async (input: NewDriverDocument) => {
      if (!userId) return;
      const path = documentPath(userId, input.fileName);
      const { error: upErr } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, stripDataUrl(input.data), { contentType: docMime(input.fileName), upsert: false });
      if (upErr) return;
      const { error } = await supabase.from("driver_documents").insert({
        user_id: userId,
        vehicle_id: input.vehicleId ?? null,
        kind: input.kind,
        file_name: input.fileName,
        file_path: path,
        status: "pending",
      } as unknown as Record<string, never>);
      if (error) return;
      await supabase
        .from("profiles")
        .update({ documents_submitted_at: new Date().toISOString() } as unknown as Record<string, never>)
        .eq("id", userId);
      await logActivity(userId, "Uploaded document", docKindLabels[input.kind]);
      await refresh();
    },
    [userId, refresh],
  );

  const setDocumentStatus = useCallback(
    async (docId: string, status: DocumentStatus) => {
      await supabase
        .from("driver_documents")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        } as unknown as Record<string, never>)
        .eq("id", docId);
      await refresh();
    },
    [refresh],
  );

  const setAccountFlag = useCallback(
    async (targetId: string, flag: "hold" | "warn" | "block", on: boolean) => {
      const at = new Date().toISOString();
      const row: Record<string, unknown> = {};
      if (flag === "hold") {
        row.held = on;
        row.held_at = on ? at : null;
      } else if (flag === "warn") {
        row.warned = on;
        row.warned_at = on ? at : null;
      } else {
        row.blocked = on;
        row.blocked_at = on ? at : null;
      }
      await supabase.from("profiles").update(row as unknown as Record<string, never>).eq("id", targetId);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      currentUser,
      loading,
      login,
      register,
      logout,
      updateUser,
      userById,
      addVehicle,
      updateVehicle,
      removeVehicle,
      setPrimaryVehicle,
      setDriverVerification,
      addDriverDocument,
      setDocumentStatus,
      setAccountFlag,
    }),
    [
      users, currentUser, loading, login, register, logout, updateUser, userById,
      addVehicle, updateVehicle, removeVehicle, setPrimaryVehicle, setDriverVerification,
      addDriverDocument, setDocumentStatus, setAccountFlag,
    ],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsers = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
};
