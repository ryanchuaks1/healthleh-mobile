import React, { useEffect, useState, useRef } from "react";
import { ScrollView, ActivityIndicator, View, Platform, TouchableOpacity, Text } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";
import GoogleFit, { Scopes } from "react-native-google-fit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "loading...",
    weight: "loading...",
    weightGoal: "loading...",
  });
  const [lastActivity, setLastActivity] = useState("Walked 2 km");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [hasCheckedDailyRecord, setHasCheckedDailyRecord] = useState(false);
  const [dailyRecord, setDailyRecord] = useState<any>(null); // stores today's daily record

  // Use a ref to hold the current step count for the interval callback.
  const stepsRef = useRef<number>(0);

  // Retrieve user phone number from AsyncStorage
  useEffect(() => {
    const getUserPhoneNumber = async () => {
      try {
        const storedPhoneNumber = await AsyncStorage.getItem("userPhoneNumber");
        if (storedPhoneNumber) {
          setUserPhoneNumber(storedPhoneNumber);
        } else {
          console.error("User phone number not found in AsyncStorage.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error retrieving user phone number:", error);
      }
    };
    getUserPhoneNumber();
  }, []);

  // Register for push notifications and set up the notification response listener
  useEffect(() => {
    async function registerForPushNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Permission not granted for notifications");
        return;
      }

      let tokenData;
      if (Platform.OS === "web") {
        // For web, use getDevicePushTokenAsync to avoid CORS issues
        tokenData = await Notifications.getDevicePushTokenAsync();
      } else {
        // For native apps, use getExpoPushTokenAsync with applicationId
        tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "4b3c3640-1bc1-4959-b3e4-a8e2395454b8",
          applicationId: "com.ryanchuaks.healthleh",
        });
      }
      const token = tokenData.data;
      console.log("Push token:", token);
      // Send token to your backend to register with Azure Notification Hub if needed.
    }

    registerForPushNotifications();

    // Listener: when the user taps on a notification.
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      // Check if a deep link URL was provided in the notification data.
      const url = response.notification.request.content.data?.url;
      if (url) {
        Linking.openURL(url);
      } else {
        // If no URL, default to navigating to the Add Activity page.
        router.push("/add-activity");
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // ... rest of your code remains unchanged

  // Fetch user health data, weight goal, and last activity once phone number is available
  useEffect(() => {
    if (!userPhoneNumber) return;
    const fetchUserDataGoalsAndActivity = async () => {
      setLoading(true);
      try {
        // Fetch user health data
        const userResponse = await fetch(`${config.API_BASE_URL}/api/users/${userPhoneNumber}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setHealthData((prev) => ({
            ...prev,
            height: userData.Height ? `${userData.Height} cm` : prev.height,
            weight: userData.Weight ? `${userData.Weight} kg` : prev.weight,
          }));
        } else {
          console.error("Error fetching user data:", userResponse.status);
        }

        // Fetch weight goal
        const goalsResponse = await fetch(`${config.API_BASE_URL}/api/goals/${userPhoneNumber}`);
        if (goalsResponse.ok) {
          const goals = await goalsResponse.json();
          const weightGoalObj = goals.find((goal: { GoalType: string }) => goal.GoalType === "Weight");
          if (weightGoalObj) {
            setHealthData((prev) => ({
              ...prev,
              weightGoal: weightGoalObj.Goal,
            }));
          }
        } else {
          console.error("Error fetching goals:", goalsResponse.status);
        }

        // Fetch the last 14 activities and update lastActivity with the most recent one
        const activitiesResponse = await fetch(`${config.API_BASE_URL}/api/user-exercises/last/${userPhoneNumber}`);
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          if (activities && activities.length > 0) {
            const latestActivity = activities[0]; // Assuming the most recent is first
            const activityText = `${latestActivity.exerciseType} for ${latestActivity.durationMinutes} minutes`;
            setLastActivity(activityText);
          } else {
            setLastActivity("No activity found");
          }
        } else {
          console.error("Error fetching last activities:", activitiesResponse.status);
          setLastActivity("No activity found");
        }
      } catch (error) {
        console.error("Error fetching user data, goals, and activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataGoalsAndActivity();
  }, [userPhoneNumber]);

  // Fetch devices for the user once phone number is available
  useEffect(() => {
    if (!userPhoneNumber) return;
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
        if (response.ok) {
          const fetchedDevices = await response.json();
          setDevices(
            fetchedDevices.map((device: { DeviceId: any; DeviceName: any; Mode: string }) => ({
              id: device.DeviceId || `device-${Math.random()}`,
              name: device.DeviceName || "Unnamed Device",
              status: device.Mode === "Input" ? "Active" : "Inactive",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [userPhoneNumber]);

  // One-time check to see if today's daily record exists; if not, post it.
  useEffect(() => {
    if (userPhoneNumber && !hasCheckedDailyRecord) {
      const todayDate = new Date().toISOString().split("T")[0];
      // For the web simulation, initialize with a random step count.
      const initialSteps = Platform.OS === "web" ? Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000 : 0;

      // Update our ref with the initial value
      stepsRef.current = initialSteps;

      fetch(`${config.API_BASE_URL}/api/dailyrecords/${userPhoneNumber}/${todayDate}`)
        .then((res) => {
          if (res.status === 404) {
            // Record does not exist; create it
            return fetch(`${config.API_BASE_URL}/api/dailyrecords`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phoneNumber: userPhoneNumber,
                recordDate: todayDate,
                totalSteps: initialSteps,
                totalCaloriesBurned: null,
                exerciseDurationMinutes: null,
                weight: null,
              }),
            }).then((res) => res.json());
          } else {
            console.log("Daily record already exists for today");
            return res.json();
          }
        })
        .then((data) => {
          console.log("Daily record status:", data);
          setDailyRecord(data);
          setHasCheckedDailyRecord(true);
        })
        .catch((error) => {
          console.error("Error checking/creating daily record:", error);
          setHasCheckedDailyRecord(true);
        });
    }
  }, [userPhoneNumber, hasCheckedDailyRecord]);

  // For Android: Fetch steps from Google Fit once on page load
  useEffect(() => {
    if (Platform.OS !== "web" && userPhoneNumber) {
      const options = {
        scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
      };

      const fetchSteps = () => {
        const stepOptions = {
          startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          endDate: new Date().toISOString(),
        };
        GoogleFit.getDailyStepCountSamples(stepOptions)
          .then((res) => {
            const stepsSample = res.find((sample) => sample.source === "com.google.android.gms:estimated_steps" || sample.source === "estimated_steps");
            if (stepsSample && stepsSample.steps.length > 0) {
              const todaySteps = stepsSample.steps.reduce((total, stepEntry) => total + (stepEntry.value || 0), 0);
              // Update the daily record with the fetched steps
              const todayDate = new Date().toISOString().split("T")[0];
              fetch(`${config.API_BASE_URL}/api/dailyrecords/${userPhoneNumber}/${todayDate}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  totalSteps: todaySteps,
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  setDailyRecord(data);
                })
                .catch((err) => {
                  console.log("Error updating daily record from Google Fit:", err);
                });
            } else {
              console.log("No steps data found for today");
            }
          })
          .catch((err) => {
            console.log("Error fetching steps data: ", err);
          });
      };

      GoogleFit.checkIsAuthorized().then(() => {
        if (!GoogleFit.isAuthorized) {
          GoogleFit.authorize(options)
            .then((authResult) => {
              if (authResult.success) {
                console.log("Google Fit authorization success");
                fetchSteps();
              } else {
                console.log("Google Fit authorization denied", authResult.message);
              }
            })
            .catch(() => {
              console.log("Google Fit authorization error");
            });
        } else {
          fetchSteps();
        }
      });
    }
  }, [userPhoneNumber]);

  // For Web: Simulate daily step increments every 120 seconds by updating the dailyRecord.
  useEffect(() => {
    if (Platform.OS === "web" && userPhoneNumber && hasCheckedDailyRecord) {
      const todayDate = new Date().toISOString().split("T")[0];
      const intervalId = setInterval(() => {
        const increment = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // random increment between 10 and 20
        stepsRef.current += increment;
        fetch(`${config.API_BASE_URL}/api/dailyrecords/${userPhoneNumber}/${todayDate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalSteps: stepsRef.current }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Daily record updated on web interval:", data);
            setDailyRecord((prev: any) => ({ ...prev, totalSteps: stepsRef.current }));
          })
          .catch((err) => console.error("Error updating daily record on web interval:", err));
      }, 120000); // 120 seconds
      return () => clearInterval(intervalId);
    }
  }, [userPhoneNumber, hasCheckedDailyRecord]);

  // Synchronize the stepsRef with the fetched dailyRecord's totalSteps
  useEffect(() => {
    if (Platform.OS === "web" && dailyRecord && dailyRecord.totalSteps !== undefined) {
      stepsRef.current = dailyRecord.totalSteps;
    }
  }, [dailyRecord]);

  // Log out function
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userPhoneNumber");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6 pt-24">
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <View>
          <ProfileSection healthData={healthData} />
          <ActivitySection
            steps={dailyRecord && dailyRecord.totalSteps ? dailyRecord.totalSteps : 0}
            lastActivity={lastActivity}
            kcalBurned={dailyRecord && dailyRecord.totalCaloriesBurned ? dailyRecord.totalCaloriesBurned : 0}
          />
          <GoalBarSection currentWeight={healthData.weight} weightGoal={healthData.weightGoal} />
          <DeviceSection devices={devices} />
          <TouchableOpacity className="bg-red-500 p-4 rounded-lg mt-4" onPress={handleLogout}>
            <Text className="text-center text-white font-bold">Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
