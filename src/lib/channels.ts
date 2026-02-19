export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  // YouTube video/livestream IDs — will play in sequence
  youtubeIds: string[];
}

export const channels: Channel[] = [
  {
    id: "lofi",
    name: "lo-fi",
    description: "chill beats to code to",
    icon: "☕",
    youtubeIds: [
      "jfKfPfyJRdk", // lofi girl
      "rUxyKA_-grg", // lofi girl 2
    ],
  },
  {
    id: "synthwave",
    name: "synthwave",
    description: "retro-futuristic focus",
    icon: "🌆",
    youtubeIds: [
      "4xDzrJKXOOY", // synthwave radio
      "MVPTGNGiI-4", // retrowave
    ],
  },
  {
    id: "ambient",
    name: "ambient",
    description: "deep focus atmospheric",
    icon: "🌌",
    youtubeIds: [
      "S_MOd40zlYU", // ambient music
      "7NOSDKb0HlU", // space ambient
    ],
  },
  {
    id: "jazz",
    name: "jazz-hop",
    description: "smooth jazz & hip-hop fusion",
    icon: "🎷",
    youtubeIds: [
      "9QLc8GHW9MI", // jazz hop cafe
      "fEvM-OUbaKs", // jazz vibes
    ],
  },
  {
    id: "deepfocus",
    name: "deep-focus",
    description: "minimal techno for flow state",
    icon: "🧠",
    youtubeIds: [
      "DWcJFNfaw9c", // deep house
      "w0o8JCxjjpM", // techno focus
    ],
  },
  {
    id: "classical",
    name: "classical",
    description: "timeless compositions",
    icon: "🎻",
    youtubeIds: [
      "jgpJVI3tDbY", // classical music
      "mIYzp5rcTvU", // classical focus
    ],
  },
];
