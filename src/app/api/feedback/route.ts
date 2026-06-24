import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_FEEDBACK_TOKEN;
const REPO = "atrivolabs/devflow";

interface FeedbackContext {
  version?: string;
  os?: string;
  arch?: string;
  node?: string;
  mode?: string;
  channel?: string;
}

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "feedback endpoint not configured" },
      { status: 503 }
    );
  }

  let message: string;
  let context: FeedbackContext;
  try {
    const body = await req.json();
    message = body.message;
    context = body.context ?? {};
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const title = message.split("\n")[0]?.trim().slice(0, 120) || "CLI feedback";
  const envLines = [
    context.os ? `- OS: ${context.os} (${context.arch ?? "unknown"})` : null,
    context.version ? `- devflow: ${context.version}` : null,
    context.node ? `- Node: ${context.node}` : null,
    context.mode ? `- Session: ${context.mode}${context.channel ? ` · ${context.channel}` : ""}` : null,
  ].filter(Boolean);

  const issueBody = [
    "## Feedback",
    "",
    message.trim(),
    "",
    ...(envLines.length ? ["## Environment", "", ...envLines, ""] : []),
    "---",
    "*Filed automatically via `devflow` CLI.*",
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: ["feedback"],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "failed to create issue" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, url: data.html_url });
}
