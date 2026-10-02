import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Guardrail from "../components/Guardrail";
import RecordComparison from "../components/RecordComparison";
import StatusChip from "../components/StatusChip";
import StrengthLabel from "../components/StrengthLabel";
import { useWorkspaceContext } from "../context/WorkspaceContext";
import { assessEvidence } from "../lib/leads";
import { colors, mono } from "../theme";

function paramId(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LeadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const leadId = paramId(id);
  const workspace = useWorkspaceContext();
  const lead = workspace.allLeads.find((item) => item.id === leadId) ?? null;
  const recordA = lead ? workspace.recordMap.get(lead.caseA) : undefined;
  const recordB = lead ? workspace.recordMap.get(lead.caseB) : undefined;

  useEffect(() => {
    if (leadId) workspace.select(leadId);
  }, [leadId, workspace.select]);

  if (!lead || !recordA || !recordB) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>This lead is no longer in the current results.</Text>
        <Text style={styles.missingBody}>Adjust the day windows or run analysis again, then come back to the list.</Text>
      </View>
    );
  }

  const isNamed = lead.source === "named";
  const evidence = assessEvidence(recordA, recordB, workspace.rules);
  const related = workspace.allLeads.filter(
    (item) => item.id !== lead.id && [item.caseA, item.caseB].some((caseId) => caseId === lead.caseA || caseId === lead.caseB),
  );
  const brief = workspace.briefs[lead.id] || "";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Possible lead · {isNamed ? "Named in the data" : "Found by area / timing rule"}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.caseId}>{lead.caseA}</Text>
          <Text style={styles.linkMark}>{isNamed ? "→" : "↔"}</Text>
          <Text style={styles.caseId}>{lead.caseB}</Text>
        </View>
        <Text style={styles.reason}>{lead.reason}</Text>
        <View style={styles.chips}>
          <StrengthLabel strength={lead.strength} />
          <StatusChip status={workspace.statusFor(lead.id)} />
        </View>

        <View style={styles.notice}>
          <Feather name="info" size={16} color={colors.accent} />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeText}>
              <Text style={styles.noticeStrong}>Needs verification. </Text>
              This lead was raised automatically from synthetic data. It is not a finding. A reviewer decides whether it is worth pursuing.
            </Text>
            {isNamed && !lead.supported ? (
              <Text style={styles.noticeText}>
                <Text style={styles.noticeStrong}>Not supported by area/timing. </Text>
                {lead.caseA} names {lead.caseB}, but they are in different areas or too far apart in time. It is shown here so a reviewer can assess it.
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Records side by side</Text>
        <RecordComparison a={recordA} b={recordB} daysApart={lead.daysApart} />

        <Text style={styles.sectionTitle}>Why this lead was raised</Text>
        {evidence.map((item) => (
          <View key={item.label} style={styles.evidence}>
            <View style={styles.evidenceTop}>
              <Text style={styles.evidenceLabel}>{item.label}</Text>
              <View style={styles.support}>
                <Feather name={item.supports ? "check" : "minus"} size={14} color={item.supports ? colors.accent : colors.inkSubtle} />
                <Text style={[styles.supportText, { color: item.supports ? colors.accent : colors.inkSubtle }]}>
                  {item.supports ? "Supports lead" : "Does not support"}
                </Text>
              </View>
            </View>
            <Text style={styles.finding}>{item.finding}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Coordination brief</Text>
        <Pressable
          onPress={() => workspace.showBrief(lead)}
          disabled={workspace.briefPending}
          style={({ pressed }) => [styles.briefButton, pressed && styles.briefPressed, workspace.briefPending && styles.disabled]}
        >
          {workspace.briefPending ? <ActivityIndicator size="small" color={colors.white} /> : null}
          <Text style={styles.briefButtonText}>{workspace.briefPending ? "Generating…" : "Generate coordination brief"}</Text>
        </Pressable>
        {brief ? (
          <View style={styles.briefCard}>
            <Text style={styles.briefText}>{brief}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Other possible leads involving these records</Text>
        {related.length === 0 ? (
          <Text style={styles.relatedEmpty}>
            No other leads involve {lead.caseA} or {lead.caseB}.
          </Text>
        ) : (
          related.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: "/lead", params: { id: item.id } })}
              style={({ pressed }) => [styles.related, pressed && styles.relatedPressed]}
            >
              <Text style={styles.relatedPair}>
                {item.caseA} {item.source === "named" ? "→" : "·"} {item.caseB}
              </Text>
              <Text style={styles.relatedMeta}>
                {item.source === "named" ? "Named in data" : "Area / timing"} · {item.reason}
              </Text>
              <View style={styles.chips}>
                <StrengthLabel strength={item.strength} />
                <StatusChip status={workspace.statusFor(item.id)} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push({ pathname: "/review", params: { id: lead.id } })}
          style={({ pressed }) => [styles.decision, pressed && styles.briefPressed]}
        >
          <Text style={styles.briefButtonText}>Record decision</Text>
        </Pressable>
      </View>
      <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.surface }}>
        <Guardrail />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  missing: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  missingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  missingBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: "center",
  },
  kicker: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  caseId: {
    fontFamily: mono,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  linkMark: {
    fontSize: 16,
    color: colors.inkSubtle,
  },
  reason: {
    fontSize: 14,
    color: colors.ink,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  notice: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
  },
  noticeCopy: {
    flex: 1,
    gap: 8,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  noticeStrong: {
    fontWeight: "700",
    color: colors.ink,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  evidence: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: 10,
    gap: 4,
  },
  evidenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  support: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  supportText: {
    fontSize: 12,
    fontWeight: "600",
  },
  finding: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  briefButton: {
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  briefPressed: {
    backgroundColor: colors.accentStrong,
  },
  briefButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.7,
  },
  briefCard: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
  },
  briefText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
  },
  relatedEmpty: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  related: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: 10,
    gap: 4,
  },
  relatedPressed: {
    backgroundColor: colors.surface,
  },
  relatedPair: {
    fontFamily: mono,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  relatedMeta: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  footer: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  decision: {
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
