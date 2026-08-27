import GoogleProviderImport from "next-auth/providers/google";

import { isEmailAllowed } from "./auth-policy.js";

const GoogleProvider = typeof GoogleProviderImport === "function"
  ? GoogleProviderImport
  : GoogleProviderImport.default;

export function createAuthOptions(env = process.env) {
  return {
    providers: [
      GoogleProvider({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
    ],
    secret: env.AUTH_SECRET,
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ user }) {
        return isEmailAllowed(
          user.email,
          env.ALLOWED_EMAILS || "",
          env.AUTH_RESTRICTED || "",
        );
      },
      async jwt({ token, profile }) {
        if (profile?.sub) token.uid = profile.sub;
        return token;
      },
      async session({ session, token }) {
        if (token?.uid) {
          session.user = session.user || {};
          session.user.id = token.uid;
        }
        return session;
      },
    },
    pages: { signIn: "/" },
  };
}

export const authOptions = createAuthOptions();
