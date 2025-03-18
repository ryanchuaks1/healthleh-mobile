import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Set up the notification response listener in the top-level layout
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      // Get the route from the notification data
      const route = response.notification.request.content.data.route;
      if (route) {
        // Optionally, check if the user is logged in
        const storedPhoneNumber = await AsyncStorage.getItem("userPhoneNumber");
        if (storedPhoneNumber) {
          router.push(route);
        } else {
          // If not logged in, you might want to navigate to the login page
          router.push("/");
        }
      }
    });
    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [router]);

  if (!loaded) {
    return null;
  }

  return (
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
        <Stack.Screen name="add-activity" options={{ headerShown: false, title: "Add Activity" }} />
        <Stack.Screen name="chart-page" options={{ headerShown: false, title: "Chart" }} />
        <Stack.Screen name="edit-activity/[id]" options={{ headerShown: false, title: "Edit Activity" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
