import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function LevelMeter({ filled, label, color = colors.inkMuted }) {
  return (
    <View style={styles.row}>
      <View style={styles.bars} accessibilityElementsHidden>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.bar,
              {
                height: 4 + step * 3,
                backgroundColor: step <= filled ? color : colors.lineStrong,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 14,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
