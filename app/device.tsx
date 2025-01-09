import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Platform, PermissionsAndroid } from "react-native";
import config from "../config.js";
import { router } from "expo-router";

export default function DeviceManagement() {
  interface Device {
    deviceId: string;
    deviceName: string;
    mode: string;
  }

  const [devices, setDevices] = useState<Device[]>([]);
  const [mockNearbyDevices] = useState<Device[]>([
    { deviceId: "12345", deviceName: "Mock Watch", mode: "Input" },
    { deviceId: "54321", deviceName: "Mock Light", mode: "Output" },
  ]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState(""); // On-screen message state
  const [loading, setLoading] = useState(false);
  const userPhoneNumber = "81228470"; // Replace with logged-in user's phone number

  const displayMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
      if (response.ok) {
        const fetchedDevices = await response.json();
        const camelCaseDevices = fetchedDevices.map((device: { DeviceId: any; DeviceName: any; Mode: any }) => ({
          deviceId: device.DeviceId,
          deviceName: device.DeviceName,
          mode: device.Mode,
        }));

        setDevices(camelCaseDevices);
      } else {
        displayMessage("Failed to fetch devices.");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      displayMessage("Failed to fetch devices.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (deviceId: string, newMode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: newMode }),
      });

      if (response.ok) {
        setDevices((prevDevices) => prevDevices.map((device) => (device.deviceId === deviceId ? { ...device, mode: newMode } : device)));
        displayMessage(`Device mode updated to ${newMode}`);
      } else {
        displayMessage("Failed to update device mode.");
      }
    } catch (error) {
      console.error("Error updating device mode:", error);
      displayMessage("Failed to update device mode.");
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDevices((prevDevices) => prevDevices.filter((device) => device.deviceId !== deviceId));
        displayMessage("Device deleted successfully.");
      } else {
        displayMessage("Failed to delete device.");
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      displayMessage("Failed to delete device.");
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async () => {
    if (!selectedDevice || !newDeviceName) {
      displayMessage("Please select a device and provide a name.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceName: newDeviceName,
          phoneNumber: userPhoneNumber,
          deviceType: "Unknown", // Replace with actual type if available
          connectionString: selectedDevice.deviceId, // Replace with the actual connection string for the device
          mode: "Input",
        }),
      });

      if (response.ok) {
        await fetchDevices(); // Refresh devices list
        setModalVisible(false);
        setSelectedDevice(null);
        setNewDeviceName("");
        displayMessage("Device added successfully!");
      } else {
        displayMessage("Failed to add device.");
      }
    } catch (error) {
      console.error("Error adding device:", error);
      displayMessage("Failed to add device.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-6">Manage Devices</Text>
      {message && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {!loading &&
        devices.map((device, index) => (
          <View key={device.deviceId || `device-${index}`} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <Text className="text-lg font-bold text-gray-800">{device.deviceName || "Unnamed Device"}</Text>
            <Text className="text-md text-gray-600 mb-2">Current Mode: {device.mode}</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`flex-1 bg-blue-500 p-3 rounded-lg shadow-md mr-2 ${device.mode === "Input" && "opacity-50"}`}
                disabled={device.mode === "Input"}
                onPress={() => handleModeChange(device.deviceId, "Input")}
              >
                <Text className="text-center text-white font-bold">Set to Input</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-green-500 p-3 rounded-lg shadow-md mx-1 ${device.mode === "Both" && "opacity-50"}`}
                disabled={device.mode === "Both"}
                onPress={() => handleModeChange(device.deviceId, "Both")}
              >
                <Text className="text-center text-white font-bold">Set to Both</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-orange-400 p-3 rounded-lg shadow-md ml-2 ${device.mode === "Output" && "opacity-50"}`}
                disabled={device.mode === "Output"}
                onPress={() => handleModeChange(device.deviceId, "Output")}
              >
                <Text className="text-center text-white font-bold">Set to Output</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="w-full bg-red-500 p-3 rounded-lg shadow-md mt-2" onPress={() => deleteDevice(device.deviceId)}>
              <Text className="text-center text-white font-bold">Delete Device</Text>
            </TouchableOpacity>
          </View>
        ))}

      <TouchableOpacity className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={() => setModalVisible(true)}>
        <Text className="text-center text-white font-bold">Add Mock Device</Text>
      </TouchableOpacity>
      <TouchableOpacity className="w-full bg-slate-500 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to home</Text>
      </TouchableOpacity>

      {/* Add Device Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-gray-900 bg-opacity-75 p-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-800 mb-4">Add New Mock Device</Text>
            {mockNearbyDevices.map((device, index) => (
              <TouchableOpacity
                key={device.deviceId || `nearby-device-${index}`}
                className={`p-3 rounded-lg shadow-md mb-2 ${selectedDevice?.deviceId === device.deviceId ? "bg-orange-400" : "bg-gray-200"}`}
                onPress={() => setSelectedDevice(device)}
              >
                <Text className="text-gray-800">{device.deviceName}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              className="w-full bg-gray-100 p-4 rounded-lg shadow-md mt-4"
              placeholder="Enter Device Name"
              value={newDeviceName}
              onChangeText={setNewDeviceName}
            />
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity className="bg-orange-400 p-4 rounded-lg flex-1 mr-2" onPress={addDevice}>
                <Text className="text-center text-white font-bold">Add Device</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-400 p-4 rounded-lg flex-1 ml-2" onPress={() => setModalVisible(false)}>
                <Text className="text-center text-white font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
