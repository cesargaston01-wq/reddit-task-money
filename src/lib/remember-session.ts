// "Remember me" handling.
// Supabase persists the session in localStorage by default, so a session
// survives browser restarts. When the user opts out, we mark the session as
// ephemeral and sign out on the next fresh browser session (new tab process).
const EPHEMERAL_KEY = "tr-ephemeral-session";

export function setRememberSession(remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.removeItem(EPHEMERAL_KEY);
    sessionStorage.removeItem(EPHEMERAL_KEY);
  } else {
    localStorage.setItem(EPHEMERAL_KEY, "1");
    sessionStorage.setItem(EPHEMERAL_KEY, "1");
  }
}

/** True when the stored session belongs to a closed browser session. */
export function isStaleEphemeralSession() {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(EPHEMERAL_KEY) === "1" &&
    sessionStorage.getItem(EPHEMERAL_KEY) !== "1"
  );
}

export function clearRememberSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EPHEMERAL_KEY);
  sessionStorage.removeItem(EPHEMERAL_KEY);
}
