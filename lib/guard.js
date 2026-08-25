/* Sign-in is only enforceable once Google credentials exist. Before then the
   app is single-user on a device, so free endpoints stay open and the one that
   spends money stays shut. */
export const authConfigured = () =>
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_SECRET);

export async function requireUser({ allowAnonymous = false } = {}) {
  if (!authConfigured()) {
    return allowAnonymous
      ? { ok: true, user: { id: "local", email: null } }
      : { ok: false, status: 503, body: { error: "not_configured" } };
  }
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return { ok: false, status: 401, body: { error: "signed out" } };
  return { ok: true, user: session.user };
}
