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
  const [loading, setLoading] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState(""); // On-screen message state
  const userPhoneNumber = "81228470"; // Replace with logged-in user's phone number

  let manager: any;

  useEffect(() => {
    if (Platform.OS !== "web") {
      const { BleManager } = require("react-native-ble-plx");
      manager = new BleManager();
    }

    fetchDevices();

    return () => {
      if (manager) {
        manager.destroy();
      }
    };
  }, []);

  const displayMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 10000);
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
      if (response.ok) {
        const fetchedDevices = await response.json();
        setDevices(fetchedDevices);
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

  const scanForDevices = async () => {
    if (Platform.OS === "web") {
      // Mock devices for web
      const mockNearbyDevices = [
        { deviceId: "12345", deviceName: "Mock Watch", mode: "Input" },
        { deviceId: "54321", deviceName: "Mock Light", mode: "Output" },
      ];
      setNearbyDevices(mockNearbyDevices);
      setModalVisible(true);
      return;
    }

    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: "Location Permission Required",
        message: "Bluetooth scanning requires location permission.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      });
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        displayMessage("Location permission is required for scanning.");
        return;
      }
    }

    if (!manager) {
      displayMessage("Bluetooth manager is not initialized.");
      return;
    }

    setLoading(true);

    const foundDevices: Device[] = [];
    manager.startDeviceScan(null, null, (error: { message: string }, device: { id: string; name: string }) => {
      if (error) {
        console.error("Error scanning for devices:", error.message);
        displayMessage("Failed to scan for devices.");
        manager.stopDeviceScan();
        setLoading(false);
        return;
      }

      if (device?.id && device?.name) {
        foundDevices.push({ deviceId: device.id, deviceName: device.name, mode: "Unknown" });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      const mockNearbyDevices = [
        { deviceId: "12345", deviceName: "Mock Watch", mode: "Input" },
        { deviceId: "54321", deviceName: "Mock Light", mode: "Output" },
      ];
      setNearbyDevices([...foundDevices, ...mockNearbyDevices]);
      setModalVisible(true);
      setLoading(false);
    }, 5000);
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-6">Manage Devices</Text>
      {message && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {!loading &&
        devices.map((device) => (
          <View key={device.deviceId} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <Text className="text-lg font-bold text-gray-800">{device.deviceName}</Text>
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

      <TouchableOpacity className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={scanForDevices}>
        <Text className="text-center text-white font-bold">Add New Device</Text>
      </TouchableOpacity>
      <TouchableOpacity className="w-full bg-slate-500 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to home</Text>
      </TouchableOpacity>

      {/* Add Device Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-gray-900 bg-opacity-75 p-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-800 mb-4">Add New Device</Text>
            {nearbyDevices.map((device) => (
              <TouchableOpacity
                key={device.deviceId}
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
              <TouchableOpacity className="bg-orange-400 p-4 rounded-lg flex-1 mr-2" onPress={() => setModalVisible(false)}>
                <Text className="text-center text-white font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
