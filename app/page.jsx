import { auth } from "@/lib/auth";
import { authConfigured } from "@/lib/guard";
import Gate from "@/components/Gate";
import LedgerApp from "@/components/LedgerApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Google credentials not set yet: single-user local mode, no sign-in wall.
  if (!authConfigured()) {
    return <LedgerApp user={{ id: "local", email: null }} />;
  }
  const session = await auth();
  if (!session?.user) {
    return <Gate />;
  }
  return <LedgerApp user={session.user} />;
}
