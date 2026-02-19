import { NextRequest, NextResponse } from "next/server";

// In-memory listener tracking (resets on deploy — fine for v1)
// Maps channelId -> Set of listener IDs
const listeners = new Map<string, Map<string, number>>();
const TIMEOUT = 30_000; // 30s heartbeat timeout

function cleanup() {
  const now = Date.now();
  for (const [channelId, map] of listeners) {
    for (const [id, ts] of map) {
      if (now - ts > TIMEOUT) map.delete(id);
    }
    if (map.size === 0) listeners.delete(channelId);
  }
}

// GET — return counts per channel
export async function GET() {
  cleanup();
  const counts: Record<string, number> = {};
  for (const [channelId, map] of listeners) {
    counts[channelId] = map.size;
  }
  return NextResponse.json(counts);
}

// POST — heartbeat: { listenerId, channelId }
export async function POST(req: NextRequest) {
  const { listenerId, channelId } = await req.json();
  if (!listenerId || !channelId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Remove listener from all other channels
  for (const [cid, map] of listeners) {
    if (cid !== channelId) map.delete(listenerId);
  }

  if (!listeners.has(channelId)) listeners.set(channelId, new Map());
  listeners.get(channelId)!.set(listenerId, Date.now());

  cleanup();
  const count = listeners.get(channelId)?.size ?? 0;
  return NextResponse.json({ count });
}

// DELETE — disconnect: { listenerId }
export async function DELETE(req: NextRequest) {
  const { listenerId } = await req.json();
  for (const [, map] of listeners) {
    map.delete(listenerId);
  }
  return NextResponse.json({ ok: true });
}
