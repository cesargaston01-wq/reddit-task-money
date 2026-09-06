import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const signupInput = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  redditProfileUrl: z
    .string()
    .trim()
    .max(255)
    .regex(/^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/),
});

type SignupResult =
  | { ok: true; requiresConfirmation: boolean }
  | { ok: false; code?: string; message: string };

function createSupabaseFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (apiKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);

    return fetch(input, { ...init, headers });
  };
}

export const createTaskRedditAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupInput.parse(input))
  .handler(async ({ data }): Promise<SignupResult> => {
    const url = process.env["SUPABASE_URL"];
    const apiKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

    if (!url || !apiKey) {
      console.error("Signup failed: account service configuration is unavailable.");
      return {
        ok: false,
        code: "service_unavailable",
        message: "The account service is temporarily unavailable. Please try again shortly.",
      };
    }

    const redditUsername =
      data.redditProfileUrl.replace(/\/+$/, "").split("/").pop() ?? data.email.split("@")[0];

    try {
      const authClient = createClient<Database>(url, apiKey, {
        global: { fetch: createSupabaseFetch(apiKey) },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: signupData, error } = await authClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: redditUsername,
            reddit_profile_url: data.redditProfileUrl,
          },
        },
      });

      if (error) {
        console.warn("Signup rejected:", error.code ?? error.message);
        return { ok: false, code: error.code, message: error.message };
      }

      return { ok: true, requiresConfirmation: !signupData.session };
    } catch (error) {
      console.error(
        "Signup request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return {
        ok: false,
        code: "service_unavailable",
        message: "The account service is temporarily unavailable. Please try again shortly.",
      };
    }
  });
