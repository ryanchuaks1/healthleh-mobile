import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, View, Platform, TouchableOpacity, Text } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";
import GoogleFit, { Scopes } from "react-native-google-fit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "loading...",
    weight: "loading...",
    weightGoal: "loading...",
  });
  const [steps, setSteps] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState("Walked 2 km");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [hasCheckedDailyRecord, setHasCheckedDailyRecord] = useState(false);

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
    if (userPhoneNumber && steps !== null && !hasCheckedDailyRecord) {
      const todayDate = new Date().toISOString().split("T")[0];
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
                totalSteps: steps,
                totalCaloriesBurned: null,
                exerciseDurationMinutes: null,
                weight: null,
              }),
            });
          } else {
            console.log("Daily record already exists for today");
            return res.json();
          }
        })
        .then((data) => {
          console.log("Daily record status:", data);
          setHasCheckedDailyRecord(true);
        })
        .catch((error) => {
          console.error("Error checking/creating daily record:", error);
          setHasCheckedDailyRecord(true);
        });
    }
  }, [userPhoneNumber]);

  // Update daily record when steps change (after the initial record check/creation)
  useEffect(() => {
    if (userPhoneNumber && steps !== null && hasCheckedDailyRecord) {
      const todayDate = new Date().toISOString().split("T")[0];
      fetch(`${config.API_BASE_URL}/api/dailyrecords/${userPhoneNumber}/${todayDate}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalSteps: steps,
          totalCaloriesBurned: null,
          exerciseDurationMinutes: null,
          weight: null,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Daily record updated on step change:", data))
        .catch((error) => console.error("Error updating daily record on step change:", error));
    }
  }, [steps, userPhoneNumber, hasCheckedDailyRecord]);

  // Fetch steps data once on page load
  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;
    if (Platform.OS === "web") {
      // For web, simulate a one-time fetch with a random value
      const initialSteps = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      setSteps(initialSteps);
    } else {
      // For Android, use Google Fit to retrieve today's steps just once
      const options = {
        scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
      };

      const fetchSteps = () => {
        const stepOptions = {
          startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), // start of day
          endDate: new Date().toISOString(),
        };
        GoogleFit.getDailyStepCountSamples(stepOptions)
          .then((res) => {
            const stepsSample = res.find((sample) => sample.source === "com.google.android.gms:estimated_steps" || sample.source === "estimated_steps");
            if (stepsSample && stepsSample.steps.length > 0) {
              const todaySteps = stepsSample.steps.reduce((total, stepEntry) => total + (stepEntry.value || 0), 0);
              setSteps(todaySteps);
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

    // No polling interval, since we're only fetching once
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userPhoneNumber]);

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
    <ScrollView className="flex-1 bg-gray-100 p-6">
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <View>
          <ProfileSection healthData={healthData} />
          <ActivitySection steps={steps || 0} lastActivity={lastActivity} />
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
