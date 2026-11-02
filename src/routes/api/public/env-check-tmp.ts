import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY diagnostic: reports only whether variables exist (never their values).
export const Route = createFileRoute("/api/public/env-check-tmp")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          LOVABLE_API_KEY: Boolean(process.env["LOVABLE_API_KEY"]),
          UDC_TALENTIR_API_KEY: Boolean(process.env["UDC_TALENTIR_API_KEY"]),
          SUPABASE_URL: Boolean(process.env["SUPABASE_URL"]),
        }),
    },
  },
});
