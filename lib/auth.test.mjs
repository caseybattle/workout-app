import assert from "node:assert/strict";
import { test } from "node:test";

import { createAuthOptions } from "./auth-options.js";

const env = {
  AUTH_GOOGLE_ID: "google-client-id",
  AUTH_GOOGLE_SECRET: "google-client-secret",
  AUTH_SECRET: "stable-session-secret",
  AUTH_RESTRICTED: "true",
  ALLOWED_EMAILS: " Allowed@Example.com, second@example.com ",
};

test("builds a stable Google OAuth configuration from the existing environment names", () => {
  const options = createAuthOptions(env);

  assert.equal(options.secret, env.AUTH_SECRET);
  assert.equal(options.session.strategy, "jwt");
  assert.equal(options.providers.length, 1);
  assert.equal(options.providers[0].id, "google");
  assert.equal(options.providers[0].options.clientId, env.AUTH_GOOGLE_ID);
  assert.equal(options.providers[0].options.clientSecret, env.AUTH_GOOGLE_SECRET);
});

test("normalizes and enforces the configured email allowlist in restricted mode", async () => {
  const options = createAuthOptions(env);

  assert.equal(await options.callbacks.signIn({ user: { email: "allowed@example.com" } }), true);
  assert.equal(await options.callbacks.signIn({ user: { email: "SECOND@EXAMPLE.COM" } }), true);
  assert.equal(await options.callbacks.signIn({ user: { email: "blocked@example.com" } }), false);
});

test("allows Google accounts by default when restricted mode is off", async () => {
  const options = createAuthOptions({ ...env, AUTH_RESTRICTED: "false" });

  assert.equal(await options.callbacks.signIn({ user: { email: "coworker@example.com" } }), true);
});

test("keeps the Google subject as the stable application user id", async () => {
  const options = createAuthOptions(env);
  const token = await options.callbacks.jwt({ token: {}, profile: { sub: "google-subject" } });
  const session = await options.callbacks.session({ session: { user: {} }, token });

  assert.equal(token.uid, "google-subject");
  assert.equal(session.user.id, "google-subject");
});
