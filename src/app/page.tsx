"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { channels, Channel } from "@/lib/channels";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
  const [playing, setPlaying] = useState(false);
  const [listenerCounts, setListenerCounts] = useState<Record<string, number>>({});
  const [time, setTime] = useState("");
  const listenerIdRef = useRef<string>("");
  const playerRef = useRef<YT.Player | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Generate stable listener ID
  useEffect(() => {
    let id = localStorage.getItem("devflow-listener-id");
    if (!id) {
      id = genId();
      localStorage.setItem("devflow-listener-id", id);
    }
    listenerIdRef.current = id;
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (document.getElementById("yt-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      const player = new YT.Player("yt-player", {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            setPlayerReady(true);
          },
          onStateChange: (e: YT.OnStateChangeEvent) => {
            if (e.data === YT.PlayerState.ENDED) {
              // Auto-play next video in channel
              player.playVideo();
            }
          },
        },
      });
    };
  }, []);

  // Heartbeat for listener count
  useEffect(() => {
    if (!playing) return;
    const beat = () => {
      fetch("/api/listeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listenerId: listenerIdRef.current,
          channelId: activeChannel.id,
        }),
      })
        .then((r) => r.json())
        .then(() => {
          // Also fetch all counts
          fetch("/api/listeners")
            .then((r) => r.json())
            .then(setListenerCounts)
            .catch(() => {});
        })
        .catch(() => {});
    };
    beat();
    const i = setInterval(beat, 15_000);
    return () => clearInterval(i);
  }, [playing, activeChannel.id]);

  // Cleanup on unload
  useEffect(() => {
    const cleanup = () => {
      navigator.sendBeacon(
        "/api/listeners",
        new Blob(
          [JSON.stringify({ listenerId: listenerIdRef.current })],
          { type: "application/json" }
        )
      );
    };
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, []);

  const playChannel = useCallback(
    (ch: Channel) => {
      setActiveChannel(ch);
      if (playerRef.current && playerReady) {
        playerRef.current.loadVideoById(ch.youtubeIds[0]);
        setPlaying(true);
        setShowVisualizer(true);
      }
    },
    [playerReady]
  );

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
      setPlaying(false);
      setShowVisualizer(false);
    } else {
      playerRef.current.loadVideoById(activeChannel.youtubeIds[0]);
      setPlaying(true);
      setShowVisualizer(true);
    }
  }, [playing, activeChannel]);

  const totalListeners = Object.values(listenerCounts).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-3xl mx-auto">
      {/* Hidden YouTube player */}
      <div className="yt-hidden">
        <div id="yt-player" />
      </div>

      {/* Header */}
      <header className="w-full mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500 glow text-lg">▶</span>
            <h1 className="text-xl text-green-400 glow tracking-wider">
              devflow.fm
            </h1>
          </div>
          <span className="text-green-700 text-sm">{time}</span>
        </div>
        <div className="text-green-700 text-xs">
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-green-600 text-xs">
            $ music --genre={activeChannel.id} --stream
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="pulse-dot text-red-500">●</span>
            <span className="text-green-600">
              {totalListeners} listener{totalListeners !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      </header>

      {/* Visualizer */}
      <div className="w-full h-16 mb-6 flex items-end justify-center gap-[3px]">
        {showVisualizer &&
          Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bar-animate bg-green-500/70 w-[4px] rounded-sm"
              style={{
                ["--duration" as any]: `${0.4 + Math.random() * 0.8}s`,
                ["--delay" as any]: `${Math.random() * 0.5}s`,
                height: "20%",
              }}
            />
          ))}
        {!showVisualizer && (
          <div className="text-green-700 text-sm">
            {playerReady ? "[ select a channel to start ]" : "[ loading player... ]"}
          </div>
        )}
      </div>

      {/* Now Playing */}
      <div className="w-full mb-6 border border-green-900/50 rounded p-4 bg-[#0d0d0d]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-600 text-xs uppercase tracking-widest">
            now playing
          </span>
          <button
            onClick={togglePlay}
            disabled={!playerReady}
            className="text-green-400 hover:text-green-300 border border-green-800 px-3 py-1 text-xs rounded hover:border-green-600 transition-colors disabled:opacity-30"
          >
            {playing ? "⏸ pause" : "▶ play"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activeChannel.icon}</span>
          <div>
            <div className="text-green-400 glow">{activeChannel.name}</div>
            <div className="text-green-700 text-sm">{activeChannel.description}</div>
          </div>
        </div>
        <div className="mt-2 text-green-800 text-xs">
          {listenerCounts[activeChannel.id] ?? 0} listening to this channel
        </div>
      </div>

      {/* Channel List */}
      <div className="w-full">
        <div className="text-green-600 text-xs uppercase tracking-widest mb-3">
          channels
        </div>
        <div className="grid gap-2">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => playChannel(ch)}
              className={`w-full text-left p-3 rounded border transition-all ${
                activeChannel.id === ch.id
                  ? "border-green-600 bg-green-950/30"
                  : "border-green-900/30 hover:border-green-800 bg-[#0d0d0d]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{ch.icon}</span>
                  <div>
                    <span className={`text-sm ${activeChannel.id === ch.id ? "text-green-400 glow" : "text-green-600"}`}>
                      {ch.name}
                    </span>
                    <span className="text-green-800 text-xs ml-2">
                      {ch.description}
                    </span>
                  </div>
                </div>
                <div className="text-green-800 text-xs">
                  {listenerCounts[ch.id] ?? 0} <span className="text-green-900">⚡</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full mt-12 text-center">
        <div className="text-green-900 text-xs">
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
        <div className="mt-2 text-green-800 text-xs">
          devflow.fm — music for developers
        </div>
        <div className="text-green-900 text-xs mt-1">
          powered by youtube • built with next.js
        </div>
      </footer>
    </main>
  );
}
