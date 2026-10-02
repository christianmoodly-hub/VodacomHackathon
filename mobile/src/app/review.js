import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AuditLog from "../components/AuditLog";
import Guardrail from "../components/Guardrail";
import StatusChip from "../components/StatusChip";
import { useWorkspaceContext } from "../context/WorkspaceContext";
import { formatHistory } from "../lib/leads";
import { colors, mono } from "../theme";

const options = [
  { status: "Unreviewed", description: "No decision recorded yet." },
  { status: "Verified", description: "Checked and worth pursuing. Does not mean the records are connected." },
  { status: "Needs more info", description: "Cannot decide without further records or context." },
  { status: "Dismissed", description: "Reviewed and not worth pursuing." },
];

function paramId(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const leadId = paramId(id);
  const workspace = useWorkspaceContext();
  const lead = workspace.allLeads.find((item) => item.id === leadId) ?? null;
  const review = lead ? workspace.reviews[lead.id] : undefined;
  const current = review?.status ?? "Unreviewed";
  const [draft, setDraft] = useState(current);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(current);
    setNote("");
    setSaved(false);
  }, [leadId]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(timer);
  }, [saved]);

  if (!lead) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>This lead is no longer in the current results.</Text>
      </View>
    );
  }

  const canSave = draft !== current || note.trim().length > 0;
  const progress = workspace.totalLeads === 0 ? 0 : (workspace.reviewedCount / workspace.totalLeads) * 100;

  function handleSave() {
    if (!canSave) return;
    workspace.saveDecision(lead.id, draft, note);
    setNote("");
    setSaved(true);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Review progress</Text>
            <Text style={styles.progressCount}>
              <Text style={styles.progressStrong}>{workspace.reviewedCount}</Text> of {workspace.totalLeads} reviewed
            </Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: workspace.totalLeads, now: workspace.reviewedCount }}
          >
            <View style={[styles.fill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.heading}>Reviewer decision</Text>
        <Text style={styles.pair}>
          {lead.caseA} · {lead.caseB}
        </Text>

        <View style={styles.options}>
          {options.map((option) => {
            const active = draft === option.status;
            return (
              <Pressable
                key={option.status}
                onPress={() => setDraft(option.status)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.status}</Text>
                  <Text style={styles.optionBody}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.noteLabel}>
          Reviewer note <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="What did you check? What would change your view?"
          placeholderTextColor={colors.inkSubtle}
          style={styles.note}
        />

        <View style={styles.saveRow}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [styles.save, !canSave && styles.saveDisabled, pressed && canSave && styles.savePressed]}
          >
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Record decision</Text>
          </Pressable>
          {saved ? (
            <View style={styles.saved}>
              <Feather name="check" size={14} color={colors.verified} />
              <Text style={styles.savedText}>Decision recorded</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.subheading}>This lead</Text>
        {!review || review.history.length === 0 ? (
          <Text style={styles.empty}>No decisions recorded for this lead yet.</Text>
        ) : (
          review.history.map((entry) => (
            <View key={entry.at} style={styles.history}>
              <View style={styles.historyTop}>
                <StatusChip status={entry.status} />
                <Text style={styles.time}>{formatHistory(entry.at)}</Text>
              </View>
              <Text style={styles.reviewer}>
                Reviewer {entry.reviewer}
                {entry.reviewer === workspace.reviewerId ? " (you)" : ""}
              </Text>
              {entry.note ? <Text style={styles.historyNote}>{entry.note}</Text> : null}
            </View>
          ))
        )}

        <View style={styles.audit}>
          <AuditLog items={workspace.auditItems} offline={workspace.offline} />
        </View>
        <Guardrail />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  missing: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  missingTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  progressCount: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  progressStrong: {
    fontWeight: "700",
    color: colors.ink,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.canvas,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
  },
  heading: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  pair: {
    fontFamily: mono,
    fontSize: 12,
    color: colors.inkSubtle,
  },
  options: {
    gap: 8,
    marginTop: 4,
  },
  option: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  optionActive: {
    borderColor: "rgba(47, 95, 107, 0.4)",
    backgroundColor: colors.accentSoft,
  },
  radio: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  optionBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkMuted,
  },
  noteLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  optional: {
    fontWeight: "400",
    color: colors.inkSubtle,
  },
  note: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: "top",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  save: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  savePressed: {
    backgroundColor: colors.accentStrong,
  },
  saveDisabled: {
    backgroundColor: colors.lineStrong,
  },
  saveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: colors.inkMuted,
  },
  saved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  savedText: {
    fontSize: 13,
    color: colors.verified,
    fontWeight: "600",
  },
  subheading: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  empty: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  history: {
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingLeft: 12,
    gap: 4,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  time: {
    fontSize: 11,
    color: colors.inkSubtle,
  },
  reviewer: {
    fontSize: 12,
    color: colors.inkSubtle,
  },
  historyNote: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  audit: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
