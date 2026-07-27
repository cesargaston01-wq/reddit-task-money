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
      { title: "Connexion — KarmaWork" },
      {
        name: "description",
        content: "Connectez-vous ou créez votre compte travailleur Reddit pour accéder aux missions rémunérées.",
      },
      { property: "og:title", content: "Connexion — KarmaWork" },
      { property: "og:description", content: "Accédez à votre espace missions Reddit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
  reddit_profile_url: z
    .string()
    .trim()
    .max(255)
    .regex(/^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/, "Ex: https://reddit.com/user/pseudo"),
  wallet_address: z.string().trim().min(10, "Adresse trop courte").max(120),
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
    navigate({ to: "/opportunites/posts" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      password: fd.get("password"),
      reddit_profile_url: fd.get("reddit_profile_url"),
      wallet_address: fd.get("wallet_address"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.full_name,
          reddit_profile_url: parsed.data.reddit_profile_url,
          wallet_address: parsed.data.wallet_address,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Compte créé. Confirmez votre email, puis connectez-vous.");
      return;
    }
    toast.success("Compte créé. Votre profil Reddit est en cours de vérification.");
    navigate({ to: "/opportunites/posts" });
  }

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8 font-display text-lg font-bold">
        Karma<span className="text-primary">Work</span>
      </Link>

      <div className="panel elevated w-full max-w-md p-6">
        <Tabs defaultValue="signup">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Inscription</TabsTrigger>
            <TabsTrigger value="login">Connexion</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">Nom</Label>
                <Input id="s-name" name="full_name" required maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" name="email" type="email" required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pass">Mot de passe</Label>
                <Input id="s-pass" name="password" type="password" required minLength={8} maxLength={72} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-reddit">Lien vers votre profil Reddit</Label>
                <Input
                  id="s-reddit"
                  name="reddit_profile_url"
                  placeholder="https://reddit.com/user/pseudo"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-wallet">Adresse wallet crypto</Label>
                <Input id="s-wallet" name="wallet_address" placeholder="0x… / TR…" required maxLength={120} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Créer mon compte
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Votre compte reste en attente jusqu'à validation manuelle.
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
                <Label htmlFor="l-pass">Mot de passe</Label>
                <Input id="l-pass" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Se connecter
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
