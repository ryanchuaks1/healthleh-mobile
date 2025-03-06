import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        <Stack.Screen name="home" options={{ title: "HealthLeh", headerShown: false }} />
        <Stack.Screen name="device" options={{ title: "Devices" }} />
        <Stack.Screen name="profile" options={{ headerShown: false, title: "Profile" }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false, title: "Edit Profile" }} />
        <Stack.Screen name="goal-chart" options={{ title: "Goal" }} />
        <Stack.Screen name="activities" options={{ title: "Activities" }} />
        <Stack.Screen name="add-activity" options={{ headerShown: false, title: "Add activity" }} />
        <Stack.Screen name="chart-page" options={{ headerShown: false, title: "Chart" }} />
        <Stack.Screen name="edit-activity/[id]" options={{ headerShown: false, title: "Edit activity" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
