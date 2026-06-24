# devflow.fm

Landing page and backend API for [devflow](https://github.com/atrivolabs/devflow), a CLI focus timer with background music.

Built with Next.js, deployed on Vercel.

## API Endpoints

### `GET /api/listeners`

Returns current listener counts per music channel.

```json
{ "lofi": 14, "synthwave": 8, "ambient": 5, "jazz": 3, "deepfocus": 10, "classical": 2 }
```

Counts combine real active listeners with an ambient baseline so channels never appear empty. The baseline per channel drifts smoothly over time (changes every ~45s) and grows ~5%/day from launch to simulate organic growth.

### `POST /api/listeners`

Heartbeat from a running devflow session. The CLI calls this every 30 seconds.

```json
{ "listenerId": "uuid", "channelId": "lofi" }
```

Returns `{ count }` for the active channel. Listeners are dropped after 30s without a heartbeat.

### `DELETE /api/listeners`

Disconnect a listener when a session ends.

```json
{ "listenerId": "uuid" }
```

### `POST /api/feedback`

Submit feedback or bug reports from the CLI. Creates a GitHub issue on `atrivolabs/devflow` with environment context.

```json
{
  "message": "music stops during breaks",
  "context": {
    "version": "0.1.0",
    "os": "Linux 6.8.0",
    "arch": "x64",
    "node": "v22.22.0",
    "mode": "pomodoro",
    "channel": "lofi"
  }
}
```

Returns `{ ok: true, url: "https://github.com/..." }` on success.

Rate limited to 5 requests/minute per IP. Message capped at 4,000 characters.

Requires `GITHUB_FEEDBACK_TOKEN` env var (fine-grained PAT with Issues write permission on the devflow repo).

## Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_FEEDBACK_TOKEN` | Yes | GitHub PAT for creating feedback issues |
