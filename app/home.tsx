import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "170 cm",
    weight: "70 kg",
    weightGoal: "65 kg",
  }); // Mock health data
  const [steps, setSteps] = useState(5000); // Mock steps
  const [lastActivity, setLastActivity] = useState("Walked 2 km"); // Mock activity
  const [devices, setDevices] = useState([
    { id: 1, name: "Fitbit", status: "Active" },
    { id: 2, name: "Smartwatch", status: "Inactive" },
  ]); // Mock devices
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Placeholder for fetching data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock delay for fetching data
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          {/* Profile Section */}
          <View className="bg-white rounded-lg shadow-md p-4 mb-6">
            <Text className="text-xl font-bold text-orange-800">Profile</Text>
            <Text className="text-md text-gray-600 mt-2">Height: {healthData.height}</Text>
            <Text className="text-md text-gray-600">Weight: {healthData.weight}</Text>
            <Text className="text-md text-gray-600">Weight Goal: {healthData.weightGoal}</Text>
          </View>

          {/* Cards Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-orange-800 mb-4">Your Activity</Text>
            <View className="flex-row justify-between mb-4">
              <View className="bg-orange-400 rounded-lg shadow-md p-4 flex-1 mr-2">
                <Text className="text-white text-lg font-bold">Steps</Text>
                <Text className="text-white text-md mt-2">{steps} steps</Text>
              </View>
              <View className="bg-green-500 rounded-lg shadow-md p-4 flex-1 ml-2">
                <Text className="text-white text-lg font-bold">Last Activity</Text>
                <Text className="text-white text-md mt-2">{lastActivity}</Text>
              </View>
            </View>
            <View className="bg-blue-500 rounded-lg shadow-md p-4">
              <Text className="text-white text-lg font-bold">Calories Burned</Text>
              <Text className="text-white text-md mt-2">450 kcal</Text>
            </View>
          </View>

          {/* Device Section */}
          <View>
            <Text className="text-xl font-bold text-orange-800 mb-4">Connected Devices</Text>
            {devices.map((device) => (
              <View key={device.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                <Text className="text-lg font-bold text-gray-800">{device.name}</Text>
                <Text className="text-md text-gray-600">Status: {device.status}</Text>
              </View>
            ))}
            <TouchableOpacity className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/device")}>
              <Text className="text-center text-white font-bold">Add New Device</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}
