import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WorkspaceProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "600", fontSize: 16 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.canvas },
            headerBackTitle: "Back",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false, title: "Leads" }} />
          <Stack.Screen name="lead" options={{ title: "Lead" }} />
          <Stack.Screen name="review" options={{ title: "Reviewer decision" }} />
        </Stack>
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}
