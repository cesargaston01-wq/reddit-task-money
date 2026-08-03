// Sessions are always persisted: Supabase stores the session in localStorage
// and refreshes it automatically, so users stay signed in on their device.
// Older builds marked some sessions as "ephemeral" and signed the user out on
// the next fresh browser/tab session — this clears any leftover marker so those
// users are no longer logged out unexpectedly.
const LEGACY_EPHEMERAL_KEY = "tr-ephemeral-session";

export function clearLegacyEphemeralSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_EPHEMERAL_KEY);
  sessionStorage.removeItem(LEGACY_EPHEMERAL_KEY);
}
