import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import ProfileSection from "../components/ProfileSection";
import ActivitySection from "../components/ActivitySection";
import DeviceSection from "../components/DeviceSection";
import GoalBarSection from "../components/GoalBarSection";
import config from "../config.js";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "170 cm",
    weight: "70 kg",
    weightGoal: "65 kg",
  }); // Mock health data
  const [steps, setSteps] = useState(5000); // Mock steps
  const [lastActivity, setLastActivity] = useState("Walked 2 km"); // Mock activity
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const userPhoneNumber = "81228470"; // Replace with the logged-in user's phone number

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
        if (response.ok) {
          const fetchedDevices = await response.json();
          setDevices(
            fetchedDevices.map((device: { DeviceId: any; DeviceName: any; Mode: string; }) => ({
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
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          <ProfileSection healthData={healthData} />
          <GoalBarSection currentWeight={healthData.weight} weightGoal={healthData.weightGoal} />
          <ActivitySection steps={steps} lastActivity={lastActivity} />
          <DeviceSection devices={devices} />
        </>
      )}
    </ScrollView>
  );
}
