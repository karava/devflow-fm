import { NextResponse } from "next/server";
import { channels } from "@/lib/channels";

// Single source of truth for the channel list.
//
// This is consumed by the devflow CLI (which fetches it at startup and falls
// back to a bundled copy when offline) and by any other client. Edit channels
// in src/lib/channels.ts — this endpoint just exposes them. Later it can read
// from a datastore (e.g. NocoDB) instead, without changing the response shape.

export const revalidate = 3600; // regenerate at most hourly

export function GET() {
  return NextResponse.json(
    { version: 1, channels },
    {
      headers: {
        // Cache hard at the CDN; channels change rarely and the CLI tolerates
        // staleness (it has a bundled fallback anyway).
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        // Public read-only data — allow browser clients too.
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
