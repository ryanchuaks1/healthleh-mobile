import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, View, Platform } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";
import GoogleFit, { Scopes } from "react-native-google-fit"; // Import Google Fit

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
  const userPhoneNumber = "81228470"; // Replace with the logged-in user's phone number

  // Fetch user health data and weight goal
  useEffect(() => {
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

  // Fetch devices for the user
  useEffect(() => {
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
      const initialSteps = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      setSteps(initialSteps);
      intervalId = setInterval(() => {
        const randomIncrease = Math.floor(Math.random() * (10 - 1 + 1)) + 1;
        setSteps((prevSteps) => prevSteps + randomIncrease);
      }, 5000);
    } else {
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
        </View>
      )}
    </ScrollView>
  );
}
