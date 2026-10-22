import { beforeAll, expect, test } from "vitest";
import { createConfirmParams, verifyConfirmParams } from "./email-confirm-token.server";

const UID = "f6b7851a-32f7-47cc-8bc1-e1de3de7737e";
beforeAll(() => { process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-key"; });

test("a fresh confirmation link is accepted", async () => {
  const p = new URLSearchParams(await createConfirmParams(UID));
  expect(await verifyConfirmParams(p.get("uid")!, p.get("exp")!, p.get("sig")!)).toBe(true);
});

test("a confirmation link for another account is rejected", async () => {
  const p = new URLSearchParams(await createConfirmParams(UID));
  expect(await verifyConfirmParams("00000000-0000-0000-0000-000000000000", p.get("exp")!, p.get("sig")!)).toBe(false);
});

test("a confirmation link expires after 7 days", async () => {
  const p = new URLSearchParams(await createConfirmParams(UID, 0));
  expect(await verifyConfirmParams(UID, p.get("exp")!, p.get("sig")!, 8 * 24 * 3600 * 1000)).toBe(false);
});
