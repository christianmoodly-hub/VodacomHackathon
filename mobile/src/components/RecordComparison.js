import { StyleSheet, Text, View } from "react-native";
import { formatGap } from "../lib/leads";
import { colors, mono } from "../theme";
import LevelMeter from "./LevelMeter";

const riskFilled = { Low: 1, Medium: 2, High: 3 };

export default function RecordComparison({ a, b, daysApart }) {
  const sameArea = a.area_code === b.area_code;
  const aNamesB = a.possible_linked_case_ref === b.case_id;
  const bNamesA = b.possible_linked_case_ref === a.case_id;
  const sameRisk = a.risk_indicator === b.risk_indicator;
  const dateNote = daysApart === 0 ? "Same day" : formatGap(daysApart).replace(/^./, (char) => char.toUpperCase());

  const rows = [
    { label: "Record type", note: null, highlight: false, left: a.record_type, right: b.record_type },
    { label: "Date reported", note: dateNote, highlight: false, left: a.date_reported, right: b.date_reported },
    {
      label: "Area code",
      note: sameArea ? "Same area" : "Different areas",
      highlight: sameArea,
      left: a.area_code,
      right: b.area_code,
    },
    {
      label: "Risk indicator",
      note: sameRisk ? "Same level" : "Context only",
      highlight: false,
      risk: true,
    },
    {
      label: "Named reference",
      note: aNamesB || bNamesA ? "Refers to the other record" : null,
      highlight: aNamesB || bNamesA,
      left: a.possible_linked_case_ref || "None",
      right: b.possible_linked_case_ref || "None",
      mono: true,
    },
  ];

  return (
    <View accessibilityLabel="Side-by-side record comparison">
      <View style={styles.headerRow}>
        <View style={styles.labelCol} />
        {[a, b].map((record, index) => (
          <View key={record.case_id} style={styles.headerCell}>
            <Text style={styles.recordLabel}>Record {index === 0 ? "A" : "B"}</Text>
            <Text style={styles.recordId}>{record.case_id}</Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={styles.labelCol}>
            <Text style={styles.field}>{row.label}</Text>
            {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
          </View>
          {row.risk ? (
            [a, b].map((record) => (
              <View key={record.case_id} style={[styles.cell, row.highlight && styles.highlight]}>
                <LevelMeter filled={riskFilled[record.risk_indicator] || 0} label={record.risk_indicator} color={colors.ink} />
              </View>
            ))
          ) : (
            [row.left, row.right].map((value, index) => (
              <View key={`${row.label}-${index}`} style={[styles.cell, row.highlight && styles.highlight]}>
                <Text style={[styles.value, row.mono && styles.monoValue, value === "None" && styles.none]}>{value}</Text>
              </View>
            ))
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  labelCol: {
    width: 86,
    paddingVertical: 10,
    justifyContent: "center",
  },
  headerCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  recordLabel: {
    fontSize: 11,
    color: colors.inkSubtle,
  },
  recordId: {
    marginTop: 2,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  field: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  note: {
    marginTop: 2,
    fontSize: 11,
    color: colors.accent,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  highlight: {
    backgroundColor: colors.accentSoft,
  },
  value: {
    fontSize: 13,
    color: colors.ink,
  },
  monoValue: {
    fontFamily: mono,
    fontSize: 11,
  },
  none: {
    color: colors.inkSubtle,
    fontFamily: undefined,
  },
});
