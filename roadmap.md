# Roadmap

- [x] Identify the server error hidden by the generic signup message.
- [x] Return specific signup and Resend delivery errors.
- [x] Preserve confirmed accounts and clean up failed unconfirmed signups.
- [x] Verify signup and confirmation end to end, including a persistent signed-in session.
- [x] Verify resend confirmation and password recovery end to end.
- [x] Publish and recheck signup on the public site.
- [x] Prevent known-weak 8-character passwords before account creation and show the precise reason.
- [x] Confirm the public signup page no longer shows the stale 8-character guidance and generic error.
- [x] Isolate the current signup failure between account creation, RPC response, and Resend delivery.
- [x] Prevent signup validation errors from escaping as an opaque generic error.
- [x] Replace the signup RPC with a fresh public signup endpoint and explicit responses.
- [x] Verify the rebuilt signup, confirmation, resend, and recovery flow end to end.
