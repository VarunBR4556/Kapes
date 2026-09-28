import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Trash2, Upload } from "lucide-react";
import { useUsers } from "@/lib/users-store";
import {
  MAX_PROFILE_PHOTO_BYTES,
  PROFILE_PHOTO_ACCEPT,
  resizeImageToDataUrl,
} from "@/lib/image";
import UserAvatar from "@/components/profile/UserAvatar";

const ProfilePhoto = () => {
  const { currentUser, updateUser } = useUsers();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!currentUser) return null;

  const photo = currentUser.profilePic;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Choose an image file", { description: "PNG, JPEG, WebP or GIF." });
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      toast("Image is too large", {
        description: `Pick an image under ${(MAX_PROFILE_PHOTO_BYTES / 1_000_000).toFixed(0)} MB.`,
      });
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      updateUser({ profilePic: dataUrl });
      toast("Profile photo updated");
    } catch {
      toast("Could not process that image", { description: "Try another photo." });
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    updateUser({ profilePic: undefined });
    toast("Profile photo removed");
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        name={currentUser.name}
        src={photo}
        className="h-16 w-16 rounded-2xl text-xl"
      />
      <div>
        <h2 className="text-lg font-bold">Profile</h2>
        <p className="text-sm text-muted-foreground">How drivers and shippers see you</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {busy ? "Processing…" : photo ? "Replace photo" : "Upload photo"}
          </Button>
          {photo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={remove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={PROFILE_PHOTO_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
};

export default ProfilePhoto;
