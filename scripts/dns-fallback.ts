/**
 * Local-runtime helper: some ISP/router resolvers refuse DNS SRV queries,
 * which breaks `mongodb+srv://` connections from scripts running on this
 * machine (Vercel resolves them fine). Fall back to public DNS only when
 * the system resolver fails.
 */
import { setServers, resolveSrv } from "node:dns/promises";

export function hostFromSrvUri(uri: string): string | null {
  const match = uri.match(/@([^/?]+)/);
  return match?.[1] ?? null;
}

export async function ensureSrvResolution(uri: string): Promise<void> {
  const host = hostFromSrvUri(uri);
  if (!host) return;

  const srv = `_mongodb._tcp.${host}`;
  try {
    await resolveSrv(srv);
    return;
  } catch {
    // fall through to public DNS
  }

  setServers(["8.8.8.8", "1.1.1.1"]);
  try {
    await resolveSrv(srv);
    console.log("  (system resolver refused SRV — using public DNS)");
  } catch (err) {
    throw new Error(
      `Could not resolve ${srv} via system or public DNS: ${(err as Error).message}`
    );
  }
}
