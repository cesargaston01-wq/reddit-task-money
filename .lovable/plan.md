## Goal

In the admin area, the Users tab should show the full list of registered people with, for each one, when they signed up and when they last completed a mission.

## What changes

Only the **Users** tab of the admin page (`/admin`). No database change is needed: the admin already loads every profile and every submission, so the "last mission" date can be derived from the submission data already in memory.

### Per-user info displayed

Each user card keeps its current content (name, email, Reddit link, wallet, status badge, Accept/Reject buttons) and gains:

- **Joined** — the account creation date, formatted (e.g. "Joined Mar 12, 2026").
- **Last mission** — the date of that user's most recent submission, with the mission title and its state (pending / approved / rejected). Shows "No mission yet" when the user has never submitted.
- **Totals** — a compact line with number of approved missions and total earned, so it's clear at a glance who is active.

### Sorting and searching

- Users sorted by most recent activity first (users with a recent submission on top), then by signup date for those with no activity.
- A small search field above the list filtering by name, email, or Reddit URL, plus quick filters for Pending / Accepted / Rejected, since the list grows with every signup.

## Technical details

- Build a `Map<user_id, submissions[]>` from the existing `useAllSubmissions()` result in `src/routes/_authenticated/admin.tsx`, and pick the max `created_at` per user for the "last mission" value.
- Match the mission title through the already-loaded missions list (or the submission's embedded mission relation if present).
- Dates formatted with `toLocaleDateString("en-US", ...)`; all labels in English, matching the current dark/orange styling and existing `panel` card structure.
- Local component state for search text and status filter; no new queries or routes.
