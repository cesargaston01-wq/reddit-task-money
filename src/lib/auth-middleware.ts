// Auth middleware for admin server functions. Same checks as the generated
// requireSupabaseAuth, but it also falls back to the public VITE_* values that
// are baked into the build, so it keeps working when the server runtime
// environment is missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { userClientFromAuthHeader } = await import("./supabase-token-client.server");
  const ctx = await userClientFromAuthHeader(getRequest()?.headers?.get("authorization"));
  return next({ context: ctx });
});
