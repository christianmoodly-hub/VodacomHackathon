import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, mono } from "../theme";
import StatusChip from "./StatusChip";
import StrengthLabel from "./StrengthLabel";

export default function LeadCard({ lead, status, onPress }) {
  const isNamed = lead.source === "named";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${lead.caseA} and ${lead.caseB}. ${lead.reason}. ${status}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.pair}>
        <Text style={styles.caseId}>{lead.caseA}</Text>
        <Text style={styles.linkMark}>{isNamed ? "→" : "↔"}</Text>
        <Text style={styles.caseId}>{lead.caseB}</Text>
      </View>
      <Text style={styles.reason}>{lead.reason}</Text>
      {isNamed && !lead.supported ? (
        <View style={styles.note}>
          <Feather name="info" size={12} color={colors.inkSubtle} />
          <Text style={styles.noteText}>Not supported by area/timing</Text>
        </View>
      ) : null}
      <View style={styles.meta}>
        <StrengthLabel strength={lead.strength} />
        <StatusChip status={status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  pressed: {
    backgroundColor: colors.canvas,
    borderColor: colors.lineStrong,
  },
  pair: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  caseId: {
    fontFamily: mono,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  linkMark: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  reason: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  noteText: {
    fontSize: 12,
    color: colors.inkSubtle,
  },
  meta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
