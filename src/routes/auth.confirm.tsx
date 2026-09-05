import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/confirm")({
  component: ConfirmPage,
});

type OtpType = "signup" | "recovery" | "email_change" | "invite" | "magiclink" | "reauthentication";

function ConfirmPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const rawType = params.get("type");
    const next = params.get("next") || "/opportunities/posts";

    if (!token_hash || !rawType) {
      setStatus("error");
      toast.error("Invalid confirmation link.");
      return;
    }

    const type = rawType as OtpType;

    async function verify(tokenHash: string, otpType: OtpType, redirectTo: string) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
      if (error) {
        setStatus("error");
        toast.error(error.message);
        setTimeout(() => navigate({ to: "/auth" }), 2000);
        return;
      }

      setStatus("success");
      toast.success("Email confirmed!");

      if (otpType === "recovery") {
        setTimeout(() => navigate({ to: "/auth/reset-password" }), 500);
      } else {
        setTimeout(() => navigate({ to: redirectTo }), 500);
      }
    }

    verify(token_hash, type, next);
  }, [navigate]);

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5">
      <div className="panel elevated w-full max-w-md p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Confirming your email</h1>
        {status === "verifying" && (
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Please wait while we verify your link...</p>
          </div>
        )}
        {status === "success" && <p className="text-green-400">Confirmed! Redirecting you...</p>}
        {status === "error" && (
          <p className="text-destructive">This link is invalid or has expired.</p>
        )}
      </div>
    </div>
  );
}
