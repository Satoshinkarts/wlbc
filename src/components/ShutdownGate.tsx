import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ShutdownGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [isShutdown, setIsShutdown] = useState(false);
  const [shutdownMessage, setShutdownMessage] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("is_shutdown, shutdown_message")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();
      if (data) {
        setIsShutdown(data.is_shutdown);
        setShutdownMessage(data.shutdown_message || "");
      }
      setChecking(false);
    };
    check();
  }, []);

  if (checking || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isShutdown && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="text-center max-w-md space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Site Unavailable</h1>
          <p className="text-muted-foreground">{shutdownMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
