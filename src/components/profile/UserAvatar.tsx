import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/format";

interface UserAvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  className?: string;
}

const UserAvatar = ({ name, src, alt, className }: UserAvatarProps) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground",
      className,
    )}
  >
    {src ? (
      <img
        src={src}
        alt={alt ?? name ?? "Profile picture"}
        className="h-full w-full object-cover"
      />
    ) : (
      initialsOf(name)
    )}
  </span>
);

export default UserAvatar;
