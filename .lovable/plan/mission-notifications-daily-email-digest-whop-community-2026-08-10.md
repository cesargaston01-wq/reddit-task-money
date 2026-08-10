# Mission notifications: daily email digest + Whop community

Goal: every verified member gets a daily email listing the new missions published in the last 24 hours, and the Whop community (https://whop.com/taskreddit) is promoted across the app as the instant-alert channel you post to manually.

## Prerequisite: sender domain

App emails require a domain you own (e.g. `taskreddit.com`). No domain is set up yet, so nothing can be sent until that step is done — it takes a few minutes and DNS verification afterwards.

Set up email domain

## 1. Daily digest email

- A new email template, styled like the site (dark accents on white background), listing each new mission: type (Post / Comment), subreddit, payout, and a button back to the dashboard.
- The email does not reveal mission instructions or post content — only what a visitor already sees publicly.
- Sent once a day at a fixed hour to every member whose account status is `accepted`.
- If there is no new mission in the last 24 h, no email goes out that day.
- Footer of the email links to the Whop community for real-time alerts.
- Unsubscribe is handled automatically by the email system.

## 2. Notification preference

- New column on profiles: `email_notifications` (on by default).
- A toggle in the member Profile page: "Email me a daily summary of new missions".
- The digest only goes to members with the toggle on.

## 3. Whop community integration

- Button "Join the community" linking to https://whop.com/taskreddit in the header, on the landing page (near the hero / how-it-works), and in the member dashboard.
- A small banner on the dashboard: "New missions are announced instantly in our Whop community."
- Same link in the daily email footer.

## Technical notes

- New table column `profiles.email_notifications boolean not null default true`, editable by the owner only (existing profile policies cover it).
- Server route `src/routes/api/public/hooks/mission-digest.ts`, secured with the project key, queries missions created in the last 24 h and sends one email per opted-in accepted member (one recipient per send, no bulk loop of a marketing list).
- Scheduled with pg_cron + pg_net at a fixed daily hour (default 09:00 UTC) calling that route.
- Uses Lovable's managed email templates; no queue or email table is created.

## Not included

- Per-tag targeting (everyone verified gets the digest, as chosen).
- Instant per-mission email (daily summary only, to avoid inbox fatigue).
- Automatic posting to Whop — you announce missions there yourself.
