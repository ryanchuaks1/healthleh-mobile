import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import config from "../config.js"; // Assuming API base URL is in config.js

export default function Home() {
  const [healthData, setHealthData] = useState({
    height: "170 cm",
    weight: "70 kg",
    weightGoal: "65 kg",
  }); // Mock health data
  const [steps, setSteps] = useState(5000); // Mock steps
  const [lastActivity, setLastActivity] = useState("Walked 2 km"); // Mock activity
  const [devices, setDevices] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { width } = Dimensions.get("window");
  const userPhoneNumber = "81228470"; // Replace with the logged-in user's phone number

  const router = useRouter();

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
        if (response.ok) {
          const fetchedDevices = await response.json();
          setDevices(
            fetchedDevices.map((device: { DeviceId: string; DeviceName: string; Mode: string }) => ({
              id: device.DeviceId || `device-${Math.random()}`,
              name: device.DeviceName || "Unnamed Device",
              status: device.Mode === "Input" ? "Active" : "Inactive",
            }))
          );
        } else {
          console.error("Failed to fetch devices.");
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
          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-orange-800 text-center">Profile</Text>
            <View className="flex flex-row items-center justify-between mt-4">
              <View className="flex flex-col flex-1 items-center">
                <Text className="text-md md:text-xl text-orange-800">Current:</Text>
                <Text className="text-md md:text-xl text-gray-600">{healthData.height}</Text>
                <Text className="text-md md:text-xl text-gray-600">{healthData.weight}</Text>
              </View>
              <Image
                source={require("../assets/images/run.png")}
                style={{
                  height: width * 0.5,
                  width: width * 0.5,
                  resizeMode: "contain",
                }}
              />
              <View className="flex flex-col flex-1 items-center">
                <Text className="text-md md:text-xl text-orange-800">Goal</Text>
                <Text className="text-md md:text-xl text-gray-600">{healthData.weightGoal}</Text>
              </View>
            </View>
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
            {devices.length > 0 ? (
              devices.map((device) => (
                <View key={device.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <Text className="text-lg font-bold text-gray-800">{device.name}</Text>
                  <Text className="text-md text-gray-600">Status: {device.status}</Text>
                </View>
              ))
            ) : (
              <Text className="text-md text-gray-600">No devices connected.</Text>
            )}
            <TouchableOpacity className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/device")}>
              <Text className="text-center text-white font-bold">Manage Devices</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}
