import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, View, Platform, TouchableOpacity, Text } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";
import GoogleFit, { Scopes } from "react-native-google-fit"; // Import Google Fit
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "loading...",
    weight: "loading...",
    weightGoal: "loading...",
  });
  const [steps, setSteps] = useState(1231);
  const [lastActivity, setLastActivity] = useState("Walked 2 km");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);

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

  // Fetch user health data and weight goal once phone number is available
  useEffect(() => {
    if (!userPhoneNumber) return;
    const fetchUserDataAndGoals = async () => {
      setLoading(true);
      try {
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
      } catch (error) {
        console.error("Error fetching user data and goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndGoals();
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

  // Polling for step data
  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;

    if (Platform.OS === "web") {
      // For web, initialize with a random value and simulate an increase
      const initialSteps = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      setSteps(initialSteps);
      intervalId = setInterval(() => {
        const randomIncrease = Math.floor(Math.random() * 10) + 1;
        setSteps((prevSteps) => prevSteps + randomIncrease);
      }, 5000);
    } else {
      // For Android, use Google Fit to retrieve today's steps
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
                // Poll every minute after authorization
                intervalId = setInterval(fetchSteps, 60000);
              } else {
                console.log("Google Fit authorization denied", authResult.message);
              }
            })
            .catch(() => {
              console.log("Google Fit authorization error");
            });
        } else {
          fetchSteps();
          intervalId = setInterval(fetchSteps, 60000);
        }
      });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

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
          <ActivitySection steps={steps} lastActivity={lastActivity} />
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
