import { Platform } from "react-native";

export const colors = {
  canvas: "#f4f5f7",
  surface: "#ffffff",
  ink: "#1b2430",
  inkMuted: "#5b6675",
  inkSubtle: "#8a93a0",
  line: "#e2e5e9",
  lineStrong: "#cdd2d8",
  accent: "#2f5f6b",
  accentStrong: "#234a54",
  accentSoft: "#eaf1f2",
  verified: "#3b6a55",
  verifiedSoft: "#e7f0eb",
  info: "#85631f",
  infoSoft: "#f5eedf",
  dismissed: "#646b75",
  dismissedSoft: "#eceef1",
  white: "#ffffff",
};

export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
