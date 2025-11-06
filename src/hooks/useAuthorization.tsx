import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthorization = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorizationData, setAuthorizationData] = useState<any>(null);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Check if user has an active authorization
      const { data, error } = await supabase
        .from("user_authorizations")
        .select("*")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error checking authorization:", error);
        setIsAuthorized(false);
      } else {
        setIsAuthorized(!!data);
        setAuthorizationData(data);
      }
    } catch (error) {
      console.error("Error in checkAuthorization:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    checkAuthorization();
  };

  return { 
    isAuthorized, 
    loading, 
    authorizationData,
    refetch 
  };
};
