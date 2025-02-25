import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, View } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "loading...",
    weight: "loading...",
    weightGoal: "loading...",
  });
  const [steps, setSteps] = useState(5000); // Mock steps
  const [lastActivity, setLastActivity] = useState("Walked 2 km"); // Mock activity
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const userPhoneNumber = "81228470"; // Replace with the logged-in user's phone number

  // Fetch user health data and weight goal
  useEffect(() => {
    const fetchUserDataAndGoals = async () => {
      setLoading(true);
      try {
        // Fetch user profile data for height and weight
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

        // Fetch goals to get the weight goal (assuming goalType "Weight")
        const goalsResponse = await fetch(`${config.API_BASE_URL}/api/goals/${userPhoneNumber}`);
        if (goalsResponse.ok) {
          const goals = await goalsResponse.json();
          // Find the goal where goalType equals "Weight"
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
