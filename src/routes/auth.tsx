import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KarmaWork" },
      {
        name: "description",
        content: "Sign in or create your Reddit worker account to access paid missions.",
      },
      { property: "og:title", content: "Sign in — KarmaWork" },
      { property: "og:description", content: "Access your Reddit missions dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
    .regex(/^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/, "e.g. https://reddit.com/user/username"),
});


function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/opportunities/posts" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      reddit_profile_url: fd.get("reddit_profile_url"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const redditUsername =
      parsed.data.reddit_profile_url.replace(/\/+$/, "").split("/").pop() ??
      parsed.data.email.split("@")[0];

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: redditUsername,
          reddit_profile_url: parsed.data.reddit_profile_url,
        },
      },
    });

    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Account created. Confirm your email, then sign in.");
      return;
    }
    toast.success("Account created. Your Reddit profile is being reviewed.");
    navigate({ to: "/opportunities/posts" });
  }

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8 font-display text-lg font-bold">
        Karma<span className="text-primary">Work</span>
      </Link>

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
                <Input id="s-pass" name="password" type="password" required minLength={8} maxLength={72} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-reddit">Link to your Reddit profile</Label>
                <Input
                  id="s-reddit"
                  name="reddit_profile_url"
                  placeholder="https://reddit.com/user/username"
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
                <Input id="l-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-pass">Password</Label>
                <Input id="l-pass" name="password" type="password" required />
              </div>
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
