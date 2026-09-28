import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
const env = rawEnv ?? {};
const url = env.VITE_SUPABASE_URL;
const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const anon = env.VITE_SUPABASE_ANON_KEY;

// Vite always substitutes import.meta.env in app builds. The esbuild test bundles
// leave it undefined, so this guard only fires in a real browser build.
if (rawEnv !== undefined && !url) {
  throw new Error(
    "VITE_SUPABASE_URL is missing. Copy .env.example to .env and fill in your project values.",
  );
}

export const supabase: SupabaseClient = createClient(
  url ?? "http://127.0.0.1:54321",
  publishable ?? anon ?? "test-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const AVATAR_BUCKET = "avatars";
export const DOCUMENT_BUCKET = "documents";

export const avatarPath = (userId: string, fileName: string) =>
  `${userId}/${Date.now()}-${fileName.replace(/[^\w.-]/g, "_")}`;

export const documentPath = (userId: string, fileName: string) =>
  `${userId}/${Date.now()}-${fileName.replace(/[^\w.-]/g, "_")}`;

export const publicAvatarUrl = (path: string | null | undefined) => {
  if (!path) return null;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
