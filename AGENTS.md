<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Talentir payout logic lives only in `src/lib/talentir.server.ts` (admin check + gateway calls), one submission per call with `customId = taskreddit-sub-<submissionId>`; it is reached via the server functions in `talentir.functions.ts`, or, when the editor preview's server has no Talentir key, via the live site's `/api/public/talentir-action` with the admin's bearer token — why: keeps the API key server-side, makes a double payment impossible, and lets payments work from the preview.
- Talentir payouts are approved by a human on Talentir's hosted `payout_approval` screen, never via the API: create (status created) → approval screen → return to `/admin?talentir=<id>` → `send-claim-link` → mark paid — why: the team's API key has no `payouts:approve` scope (Talentir grants it only on request).
- App server functions use `requireAuth` from `src/lib/auth-middleware.ts` instead of the generated `requireSupabaseAuth` — why: it falls back to the build-time VITE_ Supabase URL/key, so admin actions keep working when the runtime env vars are missing.
