import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, Alert, Platform } from "react-native";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Location from "expo-location";
import config from "../config.js";
import { ActivityProvider } from "./ActivityContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const BACKGROUND_FETCH_TASK = "background-fetch-location";

// Define the background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Background location permission not granted");
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const storedPhoneNumber = await AsyncStorage.getItem("userPhoneNumber");
    if (!storedPhoneNumber) {
      console.log("User phone number not found in AsyncStorage. Skipping location update.");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log("Background location fetched:", location.coords);

    await fetch(`${config.API_BASE_URL}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: storedPhoneNumber,
        activityDate: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }),
    });
    console.log("Location sent successfully");

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Function to register the background fetch task
async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 3600, // 1 hour in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Background fetch task registered");
  } catch (err) {
    console.log("Error registering background fetch task:", err);
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

  // Notification response listener
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const route = response.notification.request.content.data.route;
      if (route) {
        const storedPhoneNumber = await AsyncStorage.getItem("userPhoneNumber");
        if (storedPhoneNumber) {
          router.push(route);
        } else {
          router.push("/");
        }
      }
    });
    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [router]);

  // Register background fetch
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Background location permission is required.");
        return;
      }
      await registerBackgroundFetchAsync();
    })();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ActivityProvider>
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

          {/* Multi-step Add Activity Flow */}
          <Stack.Screen name="exercise-selection" options={{ headerShown: false, title: "Select Exercise" }} />
          <Stack.Screen name="timer" options={{ headerShown: false, title: "Timer" }} />
          <Stack.Screen name="rating-intensity" options={{ headerShown: false, title: "Rate & Set Intensity" }} />

          <Stack.Screen name="chart-page" options={{ headerShown: false, title: "Chart" }} />
          <Stack.Screen name="edit-activity/[id]" options={{ headerShown: false, title: "Edit Activity" }} />
        </Stack>
        <StatusBar barStyle="default" />
      </ThemeProvider>
    </ActivityProvider>
  );
}
