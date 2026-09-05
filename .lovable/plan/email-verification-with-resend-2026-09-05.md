# Email verification with Resend

## Current state
- You have a Resend account and a verified sender domain there.
- The Lovable project does not have an email domain configured yet.
- The Resend connector is not linked to this project.
- Email signups are currently auto-confirmed, so no verification email is sent.

## Goal
Send branded verification emails from your own domain via Resend when a user signs up, and require email confirmation before they can use the account.

## Steps

### 1. Link Resend to the project
- Connect the Resend connector in Lovable so the app can send emails through your Resend account.
- This creates the server-side credentials the app needs.

### 2. Configure the sender domain in Lovable
- Register the same domain you verified in Resend inside the project email settings.
- This tells Lovable which domain emails should be sent from.

### 3. Scaffold auth email templates
- Generate the authentication email templates (signup confirmation, password reset, magic link, email change).
- Style them to match TaskReddit (dark premium look, orange accent, logo).
- Deploy the associated edge function so the templates are used.

### 4. Require email confirmation
- Disable auto-confirm email signups so every new user must click the verification link.
- Update the signup flow UI to explain that a confirmation email is on its way.
- Show a "Resend confirmation email" option on the sign-in page when needed.

### 5. Test end-to-end
- Sign up with a test email, receive the Resend email, click the link, and confirm the account is activated.

## Not included
- Marketing newsletters or daily digests (this plan covers auth verification emails only).
- Custom SMTP or another provider (Resend only).

## Open question
Do you want to keep the current "sign up and land on the dashboard" behavior for now, or should email confirmation become mandatory immediately?
