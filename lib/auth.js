import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/* JWT sessions, no database adapter. For a small group this keeps the
   auth setup to two environment variables and no extra tables. */
const allowed = (process.env.ALLOWED_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      if (!allowed.length) return true;
      return allowed.includes((user.email || "").toLowerCase());
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
