import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function Guardrail() {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        Synthetic data only. For authorised human review. No action should be taken from this output.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMuted,
  },
});
