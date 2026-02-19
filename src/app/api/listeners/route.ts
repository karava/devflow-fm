import { NextRequest, NextResponse } from "next/server";

// In-memory listener tracking (resets on deploy — fine for v1)
const listeners = new Map<string, Map<string, number>>();
const TIMEOUT = 30_000; // 30s heartbeat timeout

// --- Ambient listener counts (social proof) ---
// Gives each channel a plausible baseline that drifts over time
const CHANNEL_IDS = ["lofi", "synthwave", "ambient", "jazz", "deepfocus", "classical"];

// Base range per channel [min, max] — lo-fi most popular, classical niche
const BASE_RANGES: Record<string, [number, number]> = {
  lofi:      [8, 18],
  synthwave: [4, 12],
  ambient:   [3, 9],
  jazz:      [2, 7],
  deepfocus: [5, 14],
  classical: [1, 5],
};

// Seeded pseudo-random that drifts smoothly (changes every ~45s per channel)
function ambientCount(channelId: string): number {
  const range = BASE_RANGES[channelId] ?? [2, 8];
  const [min, max] = range;

  // Use time bucket so the number drifts slowly, not every request
  const bucket = Math.floor(Date.now() / 45_000);
  // Simple hash from channel + bucket for deterministic but varied results
  let hash = 0;
  const seed = `${channelId}-${bucket}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // Map to range
  const norm = (Math.abs(hash) % 1000) / 1000; // 0-1
  return min + Math.round(norm * (max - min));
}
// --- End ambient ---

function cleanup() {
  const now = Date.now();
  for (const [channelId, map] of listeners) {
    for (const [id, ts] of map) {
      if (now - ts > TIMEOUT) map.delete(id);
    }
    if (map.size === 0) listeners.delete(channelId);
  }
}

// GET — return counts per channel (real + ambient)
export async function GET() {
  cleanup();
  const counts: Record<string, number> = {};
  for (const cid of CHANNEL_IDS) {
    const real = listeners.get(cid)?.size ?? 0;
    counts[cid] = real + ambientCount(cid);
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
  const real = listeners.get(channelId)?.size ?? 0;
  const count = real + ambientCount(channelId);
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
