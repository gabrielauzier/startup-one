import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const asService = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};
const asAnon = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
};

async function accountStatus(headers: Record<string, string>, email: string) {
  return fetch(`${API_URL}/rest/v1/rpc/email_account_status`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_email: email }),
  });
}

test.describe("auth_throttle e email_account_status (AUTH-09, AUTH-03)", () => {
  test("anon nao le nem grava auth_throttle; service role sim", async () => {
    const hash = `hash-${Date.now()}`;

    const anonInsert = await fetch(`${API_URL}/rest/v1/auth_throttle`, {
      method: "POST",
      headers: asAnon,
      body: JSON.stringify({ key_hash: hash, kind: "reset" }),
    });
    expect(anonInsert.ok).toBe(false);

    const serviceInsert = await fetch(`${API_URL}/rest/v1/auth_throttle`, {
      method: "POST",
      headers: { ...asService, Prefer: "return=minimal" },
      body: JSON.stringify({ key_hash: hash, kind: "reset" }),
    });
    expect(serviceInsert.status).toBe(201);

    const anonRead = await fetch(`${API_URL}/rest/v1/auth_throttle?key_hash=eq.${hash}`, {
      headers: asAnon,
    });
    expect(await anonRead.json()).toEqual([]);

    const serviceRead = await fetch(`${API_URL}/rest/v1/auth_throttle?key_hash=eq.${hash}`, {
      headers: asService,
    });
    expect(await serviceRead.json()).toHaveLength(1);
  });

  test("kind fora de signup/magic/reset e rejeitado pelo banco", async () => {
    const res = await fetch(`${API_URL}/rest/v1/auth_throttle`, {
      method: "POST",
      headers: asService,
      body: JSON.stringify({ key_hash: "x", kind: "outro" }),
    });
    expect(res.ok).toBe(false);
  });

  test("email_account_status devolve none, unconfirmed e confirmed", async () => {
    const stamp = Date.now();
    const confirmed = `status-ok-${stamp}@example.com`;
    const pending = `status-pend-${stamp}@example.com`;

    await fetch(`${API_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: asService,
      body: JSON.stringify({ email: confirmed, email_confirm: true }),
    });
    await fetch(`${API_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: asService,
      body: JSON.stringify({ email: pending, email_confirm: false }),
    });

    expect(await (await accountStatus(asService, `nao-existe-${stamp}@example.com`)).json()).toBe("none");
    expect(await (await accountStatus(asService, pending)).json()).toBe("unconfirmed");
    expect(await (await accountStatus(asService, confirmed.toUpperCase())).json()).toBe("confirmed");
  });

  test("email_account_status e negada a anon", async () => {
    const res = await accountStatus(asAnon, "qualquer@example.com");
    expect(res.ok).toBe(false);
  });
});
