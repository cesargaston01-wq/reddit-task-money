import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — TaskReddit" },
      { name: "description", content: "Choose a new password for your TaskReddit account." },
      { property: "og:title", content: "Reset your password — TaskReddit" },
      {
        property: "og:description",
        content: "Choose a new password for your TaskReddit account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (password.length < 8) return toast.error("8 characters minimum");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/opportunities/posts" });
  }

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="panel elevated w-full max-w-md space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" name="password" required minLength={8} maxLength={72} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" name="confirm" required minLength={8} maxLength={72} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Update password
        </Button>
      </form>
    </div>
  );
}
