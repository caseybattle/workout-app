import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";

export { authOptions };

export function auth() {
  return getServerSession(authOptions);
}
