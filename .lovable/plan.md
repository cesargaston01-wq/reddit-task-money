# Optional WhatsApp number in the profile

## Goal
Let members optionally add their phone number so they can join the WhatsApp group and get instant alerts when a new mission is published.

## What the user sees
- On the Profile page, a new optional field: "WhatsApp number (optional)" with a short explanation: used only to add you to the WhatsApp group where new missions are announced instantly.
- International format hint (e.g. +33 6 12 34 56 78), Save button, success/error toast, same styling as the wallet field.
- Clearly marked "Optional — leave empty if you prefer email only."
- In the admin Users view, the phone number is shown next to each member (with the niches/wallet info) so the group can be managed manually.

## Data
- Add a `phone_number` text column on profiles, default empty, optional.
- Members can read and update their own number; admins can read it. The existing profile protection rule keeps status/email untouched.

## Validation
- Trim input, allow only digits, spaces, `+`, `-`, `(`, `)`; length 6–20 characters. Empty string allowed (means "no number").
- Client-side check with a clear error message before saving.

## Technical notes
- Migration: `ALTER TABLE public.profiles ADD COLUMN phone_number text NOT NULL DEFAULT ''`. No new grants/policies needed — existing profiles grants and policies cover it; the `protect_profile_fields` trigger does not block this field, so users can edit their own.
- UI: extend `src/routes/_authenticated/profile.tsx` with local state + save handler mirroring the wallet flow, and invalidate the `profile` query.
- Admin: display the number in the users table in `src/routes/_authenticated/admin.tsx`.
