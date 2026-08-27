import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "./auth-policy.js";

/* JWT sessions, no database adapter. Google sign-in is open by default.
   To restrict access, explicitly set AUTH_RESTRICTED=true and provide a
   comma-separated ALLOWED_EMAILS list. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(
        user.email,
        process.env.ALLOWED_EMAILS || "",
        process.env.AUTH_RESTRICTED || ""
      );
    },
    async jwt({ token, profile }) {
      if (profile?.sub) token.uid = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) session.user.id = token.uid;
      return session;
    },
  },
  pages: { signIn: "/" },
});
