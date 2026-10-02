import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const stylesByStatus = {
  Unreviewed: { bg: colors.surface, border: colors.lineStrong, color: colors.inkMuted, icon: "circle" },
  Verified: { bg: colors.verifiedSoft, border: "transparent", color: colors.verified, icon: "check" },
  "Needs more info": { bg: colors.infoSoft, border: "transparent", color: colors.info, icon: "help-circle" },
  Dismissed: { bg: colors.dismissedSoft, border: "transparent", color: colors.dismissed, icon: "minus" },
};

export default function StatusChip({ status }) {
  const tone = stylesByStatus[status] || stylesByStatus.Unreviewed;
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Feather name={tone.icon} size={12} color={tone.color} />
      <Text style={[styles.label, { color: tone.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
