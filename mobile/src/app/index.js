import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Guardrail from "../components/Guardrail";
import LeadCard from "../components/LeadCard";
import { useWorkspaceContext } from "../context/WorkspaceContext";
import { formatClock } from "../lib/leads";
import { colors } from "../theme";

const filters = [
  { value: "all", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
];

function WindowField({ label, value, onChange }) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit(next) {
    const cleaned = next.replace(/[^0-9]/g, "").slice(0, 3);
    setText(cleaned);
    const parsed = Number(cleaned);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 365) onChange(String(parsed));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={commit}
        onBlur={() => {
          const parsed = Number(text);
          if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) setText(String(value));
        }}
        keyboardType="number-pad"
        maxLength={3}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

function LeadGroup({ title, description, leads, emptyText, statusFor, onOpen }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupCount}>{leads.length}</Text>
      </View>
      <Text style={styles.groupDescription}>{description}</Text>
      {leads.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} status={statusFor(lead.id)} onPress={() => onOpen(lead.id)} />
        ))
      )}
    </View>
  );
}

export default function LeadsScreen() {
  const router = useRouter();
  const workspace = useWorkspaceContext();
  const emptyText = workspace.filter === "all" ? "No leads found by this rule." : "No leads in this view.";

  function confirmReset() {
    Alert.alert(
      "Reset the workspace?",
      `This restores the original ${workspace.originalCount} synthetic records and clears every reviewer decision and note.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset workspace", onPress: workspace.reset },
      ],
    );
  }

  function openLead(id) {
    workspace.select(id);
    router.push({ pathname: "/lead", params: { id } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Feather name="shield" size={16} color={colors.accent} />
          <Text style={styles.brand}>SHE-SHIELD Response</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Synthetic data</Text>
          </View>
          {workspace.offline ? (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.stats}>
          <Text style={styles.statsStrong}>{workspace.records.length}</Text> records
          {"  ·  "}
          <Text style={styles.statsStrong}>{workspace.totalLeads}</Text> possible leads
        </Text>
        <Text style={styles.status}>
          {workspace.isRunning
            ? `Analysing ${workspace.records.length} records…`
            : workspace.pendingRecords > 0
              ? `${workspace.pendingRecords} new ${workspace.pendingRecords === 1 ? "record" : "records"} not yet analysed`
              : `Last run ${formatClock(workspace.ranAt)}`}
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={workspace.addExample}
            disabled={!workspace.canAddExample || workspace.isRunning}
            style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed, (!workspace.canAddExample || workspace.isRunning) && styles.disabled]}
          >
            <Feather name="plus" size={14} color={colors.inkMuted} />
            <Text style={styles.ghostText}>{workspace.canAddExample ? "Example" : "Added"}</Text>
          </Pressable>
          <Pressable onPress={confirmReset} style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed]}>
            <Feather name="rotate-ccw" size={14} color={colors.inkMuted} />
            <Text style={styles.ghostText}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={workspace.runAnalysis}
            disabled={workspace.isRunning}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, workspace.isRunning && styles.disabled]}
          >
            {workspace.isRunning ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Feather name="play" size={14} color={colors.white} />
            )}
            <Text style={styles.primaryText}>{workspace.isRunning ? "Analysing…" : "Run analysis"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.screenTitle}>Possible leads</Text>
        <View style={styles.filters} accessibilityRole="radiogroup">
          {filters.map((item) => {
            const active = workspace.filter === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => workspace.setFilter(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.windows}>
          <WindowField label="Same area, days" value={workspace.rules.sameAreaWindowDays} onChange={workspace.setSameAreaDays} />
          <WindowField
            label="Different areas, days"
            value={workspace.rules.crossAreaWindowDays}
            onChange={workspace.setCrossAreaDays}
          />
        </View>
        <Text style={styles.assumption}>Reviewer assumptions, not columns in the CSV.</Text>
      </View>

      <ScrollView style={[styles.list, workspace.isRunning && styles.busy]} contentContainerStyle={styles.listContent}>
        <LeadGroup
          title="Area / timing leads"
          description={`Same area within ${workspace.rules.sameAreaWindowDays} days, or different areas within ${workspace.rules.crossAreaWindowDays} days.`}
          leads={workspace.areaLeads}
          emptyText={emptyText}
          statusFor={workspace.statusFor}
          onOpen={openLead}
        />
        <View style={styles.divider} />
        <LeadGroup
          title="Links named in the data"
          description="A record names another case as possibly related. Shown whether or not area and timing agree."
          leads={workspace.namedLeads}
          emptyText={emptyText}
          statusFor={workspace.statusFor}
          onOpen={openLead}
        />
      </ScrollView>
      <Guardrail />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  offlineBadge: {
    borderWidth: 1,
    borderColor: "rgba(133, 99, 31, 0.3)",
    backgroundColor: colors.infoSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.info,
  },
  stats: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  statsStrong: {
    fontWeight: "700",
    color: colors.ink,
  },
  status: {
    fontSize: 12,
    color: colors.inkSubtle,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  ghost: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ghostPressed: {
    backgroundColor: colors.canvas,
  },
  ghostText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  primary: {
    marginLeft: "auto",
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryPressed: {
    backgroundColor: colors.accentStrong,
  },
  primaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.55,
  },
  controls: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 10,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  filters: {
    flexDirection: "row",
    backgroundColor: colors.canvas,
    borderRadius: 8,
    padding: 3,
  },
  filter: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  filterActive: {
    backgroundColor: colors.surface,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  filterTextActive: {
    color: colors.ink,
  },
  windows: {
    flexDirection: "row",
    gap: 8,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkSubtle,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.ink,
  },
  assumption: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkSubtle,
  },
  list: {
    flex: 1,
  },
  busy: {
    opacity: 0.5,
  },
  listContent: {
    paddingBottom: 16,
  },
  group: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  groupCount: {
    fontSize: 12,
    color: colors.inkSubtle,
  },
  groupDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSubtle,
    marginBottom: 4,
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
    textAlign: "center",
    color: colors.inkSubtle,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 16,
    marginTop: 16,
  },
});
