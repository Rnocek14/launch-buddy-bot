import { useWaitlistCount } from "@/hooks/useWaitlistCount";
import { Users } from "lucide-react";

export const LiveCounter = () => {
  const { count, isLoading } = useWaitlistCount();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
        <Users className="w-4 h-4" />
        <span>Loading community count...</span>
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
      <Users className="w-4 h-4" />
      <span>
        Join{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {count.toLocaleString()}+
        </span>{" "}
        privacy-conscious users taking back control
      </span>
    </p>
  );
};
