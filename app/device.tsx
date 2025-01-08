import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Alert } from "react-native";

export default function DeviceManagement() {
  interface Device {
    id: number;
    name: string;
    mode: string;
  }

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  interface NearbyDevice {
    id: string;
    name: string;
  }

  const [nearbyDevices, setNearbyDevices] = useState<NearbyDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<NearbyDevice | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Placeholder API call to fetch devices
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const mockDevices = [
          { id: 1, name: "Fitbit", mode: "Input" },
          { id: 2, name: "Smartwatch", mode: "Both" },
        ];
        setDevices(mockDevices);
      } catch (error) {
        console.error("Error fetching devices:", error);
        Alert.alert("Error", "Failed to fetch devices.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleModeChange = async (deviceId: number, newMode: string) => {
    try {
      setLoading(true);
      console.log(`Updating device ${deviceId} mode to ${newMode}`);
      setTimeout(() => {
        setDevices((prevDevices) => prevDevices.map((device) => (device.id === deviceId ? { ...device, mode: newMode } : device)));
        setLoading(false);
        Alert.alert("Success", `Device mode updated to ${newMode}`);
      }, 1000);
    } catch (error) {
      console.error("Error updating device mode:", error);
      Alert.alert("Error", "Failed to update device mode.");
      setLoading(false);
    }
  };

  const scanForDevices = async () => {
    // Mock Bluetooth scan
    setLoading(true);
    setTimeout(() => {
      const mockNearbyDevices = [
        { id: "BT001", name: "Nearby Device 1" },
        { id: "BT002", name: "Nearby Device 2" },
      ];
      setNearbyDevices(mockNearbyDevices);
      setLoading(false);
      setModalVisible(true);
    }, 2000);
  };

  const addDevice = async () => {
    if (!selectedDevice || !newDeviceName) {
      Alert.alert("Error", "Please select a device and provide a name.");
      return;
    }
    try {
      setLoading(true);
      console.log("Adding device:", {
        id: selectedDevice.id,
        name: newDeviceName,
      });
      // Mock API call to save device
      setTimeout(() => {
        setDevices((prevDevices) => [...prevDevices, { id: Number(selectedDevice.id), name: newDeviceName, mode: "Input" }]);
        setModalVisible(false);
        setSelectedDevice(null);
        setNewDeviceName("");
        setLoading(false);
        Alert.alert("Success", "Device added successfully!");
      }, 1000);
    } catch (error) {
      console.error("Error adding device:", error);
      Alert.alert("Error", "Failed to add device.");
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-6">Manage Devices</Text>
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {!loading &&
        devices.map((device) => (
          <View key={device.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <Text className="text-lg font-bold text-gray-800">{device.name}</Text>
            <Text className="text-md text-gray-600 mb-2">Current Mode: {device.mode}</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`flex-1 bg-blue-500 p-3 rounded-lg shadow-md mr-2 ${device.mode === "Input" && "opacity-50"}`}
                disabled={device.mode === "Input"}
                onPress={() => handleModeChange(device.id, "Input")}
              >
                <Text className="text-center text-white font-bold">Set to Input</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-green-500 p-3 rounded-lg shadow-md mx-1 ${device.mode === "Both" && "opacity-50"}`}
                disabled={device.mode === "Both"}
                onPress={() => handleModeChange(device.id, "Both")}
              >
                <Text className="text-center text-white font-bold">Set to Both</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-orange-400 p-3 rounded-lg shadow-md ml-2 ${device.mode === "Output" && "opacity-50"}`}
                disabled={device.mode === "Output"}
                onPress={() => handleModeChange(device.id, "Output")}
              >
                <Text className="text-center text-white font-bold">Set to Output</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      {/* Add Device Button */}
      <TouchableOpacity className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={scanForDevices}>
        <Text className="text-center text-white font-bold">Add New Device</Text>
      </TouchableOpacity>

      {/* Add Device Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-gray-900 bg-opacity-75 p-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-800 mb-4">Add New Device</Text>
            {nearbyDevices.map((device) => (
              <TouchableOpacity
                key={device.id}
                className={`p-3 rounded-lg shadow-md mb-2 ${selectedDevice?.id === device.id ? "bg-orange-400" : "bg-gray-200"}`}
                onPress={() => setSelectedDevice(device)}
              >
                <Text className="text-gray-800">{device.name}</Text>
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
