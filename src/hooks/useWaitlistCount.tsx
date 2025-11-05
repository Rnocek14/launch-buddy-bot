import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useWaitlistCount = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial count
    const fetchCount = async () => {
      const { count: initialCount, error } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });

      if (!error && initialCount !== null) {
        setCount(initialCount);
      }
      setIsLoading(false);
    };

    fetchCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("waitlist-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waitlist",
        },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, isLoading };
};
