import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/data";
import {
  requestPasswordResetWithResend,
  resendConfirmationWithResend,
  signUpWithResend,
} from "@/lib/auth-email.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TaskReddit" },
      {
        name: "description",
        content: "Sign in or create your Reddit worker account to access paid missions.",
      },
      { property: "og:title", content: "Sign in — TaskReddit" },
      { property: "og:description", content: "Access your Reddit missions dashboard." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://reddit-task-money.lovable.app/auth" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://reddit-task-money.lovable.app/auth" }],
  }),

  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "8 characters minimum").max(72),
  reddit_profile_url: z
    .string()
    .trim()
    .max(255)
    .regex(
      /^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/,
      "e.g. https://reddit.com/user/username",
    ),
});

function normalizeRedditUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }

  const username = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
  if (!username) return trimmed;
  return `https://reddit.com/user/${username}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const signUp = useServerFn(signUpWithResend);
  const resendConfirmation = useServerFn(resendConfirmationWithResend);
  const requestPasswordReset = useServerFn(requestPasswordResetWithResend);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const { data: user, isLoading: isRestoringSession } = useSession();

  useEffect(() => {
    if (user) navigate({ to: "/opportunities/posts", replace: true });
  }, [navigate, user]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    setPendingEmail(email);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(fd.get("password") ?? ""),
    });
    setLoading(false);
    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("email not confirmed") ||
        error.code === "email_not_confirmed" ||
        message.includes("not confirmed")
      ) {
        setConfirmEmail(email);
        setShowConfirmMessage(true);
        return;
      }
      return toast.error(error.message);
    }
    navigate({ to: "/opportunities/posts" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const redditUrl = normalizeRedditUrl(String(fd.get("reddit_profile_url") ?? ""));
    const parsed = signupSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      reddit_profile_url: redditUrl,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const redditUsername =
      parsed.data.reddit_profile_url.replace(/\/+$/, "").split("/").pop() ??
      parsed.data.email.split("@")[0];

    setLoading(true);
    try {
      const result = await signUp({
        data: {
          email: parsed.data.email,
          password: parsed.data.password,
          redditProfileUrl: parsed.data.reddit_profile_url,
        },
      });
      if (!result.ok) return toast.error(result.message);
      setConfirmEmail(parsed.data.email);
      setShowConfirmMessage(true);
    } catch {
      toast.error("We could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!confirmEmail) return;
    setLoading(true);
    try {
      await resendConfirmation({ data: { email: confirmEmail } });
      toast.success("If this account still needs confirmation, a new email has been sent.");
    } catch {
      toast.error("We could not send the confirmation email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const email = window.prompt("Enter your email to receive a reset link:");
    if (!email) return;
    const parsedEmail = z.string().trim().email().max(255).safeParse(email);
    if (!parsedEmail.success) return toast.error("Enter a valid email address.");
    setLoading(true);
    try {
      await requestPasswordReset({ data: { email: parsedEmail.data } });
      toast.success("If an account exists for this email, a reset link has been sent.");
    } catch {
      toast.error("We could not process this request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isRestoringSession || user) {
    return (
      <div className="hero-surface flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  if (showConfirmMessage) {
    return (
      <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5 py-12">
        <Link to="/" className="mb-8 font-display text-lg font-bold">
          Task<span className="text-primary">Reddit</span>
        </Link>
        <div className="panel elevated w-full max-w-md p-6 text-center">
          <h1 className="mb-4 text-xl font-bold">Confirm your email</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <strong className="text-foreground">{confirmEmail}</strong>. Click it to activate your
            account.
          </p>
          <Button
            onClick={handleResendConfirmation}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Resend confirmation email
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Already confirmed?{" "}
            <button
              type="button"
              onClick={() => setShowConfirmMessage(false)}
              className="underline hover:text-foreground"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8 font-display text-lg font-bold">
        Task<span className="text-primary">Reddit</span>
      </Link>

      <h1 className="mb-6 text-center text-2xl font-bold">Access your TaskReddit account</h1>

      <div className="panel elevated w-full max-w-md p-6">
        <Tabs defaultValue="signup">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="login">Sign in</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" name="email" type="email" required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pass">Password</Label>
                <PasswordInput id="s-pass" name="password" required minLength={8} maxLength={72} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="s-reddit">Link to your Reddit profile or @username</Label>
                <Input
                  id="s-reddit"
                  name="reddit_profile_url"
                  placeholder="https://reddit.com/user/username or @username"
                  required
                  maxLength={255}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Create my account
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Your account stays pending until it's manually reviewed.
              </p>
            </form>
          </TabsContent>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="l-email">Email</Label>
                <Input
                  id="l-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={pendingEmail}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-pass">Password</Label>
                <PasswordInput id="l-pass" name="password" required />
              </div>
              <p className="text-right text-xs">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-muted-foreground underline hover:text-foreground"
                >
                  Forgot password?
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                You'll stay signed in on this device until you sign out.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                Sign in
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
