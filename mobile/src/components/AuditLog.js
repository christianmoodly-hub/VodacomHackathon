import { StyleSheet, Text, View } from "react-native";
import { formatHistory } from "../lib/leads";
import { colors, mono } from "../theme";

const decisionLabel = {
  verified: "Verified",
  dismissed: "Dismissed",
  needs_more_info: "Needs more info",
};

export default function AuditLog({ items, offline }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Decision history</Text>
      {offline ? (
        <Text style={styles.offline}>
          Offline mode. Server history is unavailable. A brief is written from the local template.
        </Text>
      ) : null}
      {!offline && items.length === 0 ? <Text style={styles.empty}>No audit or decision rows yet.</Text> : null}
      {items.map((item) => (
        <View key={`${item.lead_id}-${item.timestamp}`} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.title}>
              {item.item_type === "decision" ? decisionLabel[item.decision] || item.decision : "Brief audit"}
            </Text>
            <Text style={styles.time}>{formatHistory(item.timestamp)}</Text>
          </View>
          <Text style={styles.leadId}>{item.lead_id}</Text>
          <Text style={styles.meta}>
            Reviewer {item.reviewer || "R-07"}
            {item.model_id ? ` · ${item.model_id}` : ""}
            {item.data_file ? ` · ${item.data_file}` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  offline: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.info,
  },
  empty: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  item: {
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingLeft: 12,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  time: {
    fontSize: 11,
    color: colors.inkSubtle,
  },
  leadId: {
    fontFamily: mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  meta: {
    fontSize: 12,
    color: colors.inkSubtle,
  },
});
