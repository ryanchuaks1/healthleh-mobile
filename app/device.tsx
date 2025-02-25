import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Platform, PermissionsAndroid } from "react-native";
import config from "../config.js";
import { router } from "expo-router";
import { BleManager } from "react-native-ble-plx";
import { MaterialIcons } from "@expo/vector-icons";

export default function DeviceManagement() {
  // Device interface
  interface Device {
    deviceId: string;
    deviceName: string;
    mode: string;
    name?: string; // Optional name property
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

  // State for editing a device
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedMode, setEditedMode] = useState("");

  const bleManager = Platform.OS === "android" ? new BleManager() : null;
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState<string | null>(null);

  const displayMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      console.log("API_BASE_URL:", `${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${userPhoneNumber}`);
      if (response.ok) {
        const fetchedDevices = await response.json();
        if (fetchedDevices.length === 0) {
          displayMessage("No devices found.");
        } else {
          const camelCaseDevices = fetchedDevices.map((device: { DeviceId: any; DeviceName: any; Mode: any }) => ({
            deviceId: device.DeviceId,
            deviceName: device.DeviceName,
            mode: device.Mode,
          }));
          setDevices(camelCaseDevices);
        }
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

  const handleSaveEdit = async (deviceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceName: editedName, mode: editedMode }),
      });

      if (response.ok) {
        setDevices((prevDevices) =>
          prevDevices.map((device) => (device.deviceId === deviceId ? { ...device, deviceName: editedName, mode: editedMode } : device))
        );
        displayMessage("Device updated successfully!");
        setEditingDeviceId(null);
      } else {
        displayMessage("Failed to update device.");
      }
    } catch (error) {
      console.error("Error updating device:", error);
      displayMessage("Failed to update device.");
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
          deviceId: Date.now(), // Generate a unique device ID; replace with actual Bluetooth device ID when available
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

  const scanAndConnect = async () => {
    if (Platform.OS !== "android" || !bleManager) {
      console.log("Bluetooth scanning is only available on Android.");
      return;
    }

    await requestPermissions();

    bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.error("Bluetooth Scan Error:", error);
        return;
      }

      if (device?.name?.includes("IoT_Device")) {
        // Change this based on your device's name
        console.log("Found IoT Device:", device.name);
        bleManager.stopDeviceScan();

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          setConnectedDevice(connected as unknown as Device);

          connected.monitorCharacteristicForService(
            "service-uuid", // Replace with actual Service UUID
            "characteristic-uuid", // Replace with actual Characteristic UUID
            (error, characteristic) => {
              if (error) {
                console.error("Read Error:", error);
                return;
              }
              if (characteristic?.value) {
                const data = Buffer.from(characteristic.value, "base64").toString();
                console.log("Received Data:", data);
                setSensorData(data);
              }
            }
          );
        } catch (error) {
          console.error("Connection Error:", error);
        }
      }
    });
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-6">Manage Devices</Text>
      {message && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {connectedDevice && (
        <View className="bg-white rounded-lg shadow-md p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800">Connected to {connectedDevice.name}</Text>
          {sensorData && <Text className="text-md text-gray-600">Received Data: {sensorData}</Text>}
        </View>
      )}
      {!loading &&
        devices.map((device, index) => {
          const isEditing = editingDeviceId === device.deviceId;
          return (
            <View key={device.deviceId || `device-${index}`} className="bg-white rounded-lg shadow-md p-4 mb-4">
              {!isEditing ? (
                <>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-gray-800">{device.deviceName || "Unnamed Device"}</Text>
                    <TouchableOpacity
                      className="bg-blue-500 p-2 rounded-lg shadow-md"
                      onPress={() => {
                        setEditingDeviceId(device.deviceId);
                        setEditedName(device.deviceName);
                        setEditedMode(device.mode);
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-md text-gray-600 mb-2">Current Mode: {device.mode}</Text>
                </>
              ) : (
                <>
                  <TextInput
                    className="w-full bg-gray-100 p-4 rounded-lg shadow-md mb-2"
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Edit Device Name"
                  />
                  <Text className="text-md text-gray-600 mb-2">Selected Mode: {editedMode}</Text>
                  <View className="flex-row justify-between mb-2">
                    <TouchableOpacity
                      className={`flex-1 bg-blue-500 p-2 rounded-lg shadow-md mr-1 ${editedMode === "Input" && "opacity-50"}`}
                      disabled={editedMode === "Input"}
                      onPress={() => setEditedMode("Input")}
                    >
                      <Text className="text-center text-white font-bold">Input</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 bg-green-500 p-2 rounded-lg shadow-md mx-1 ${editedMode === "Both" && "opacity-50"}`}
                      disabled={editedMode === "Both"}
                      onPress={() => setEditedMode("Both")}
                    >
                      <Text className="text-center text-white font-bold">Both</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 bg-orange-400 p-2 rounded-lg shadow-md ml-1 ${editedMode === "Output" && "opacity-50"}`}
                      disabled={editedMode === "Output"}
                      onPress={() => setEditedMode("Output")}
                    >
                      <Text className="text-center text-white font-bold">Output</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row justify-between my-2">
                    <TouchableOpacity className="flex-1 bg-red-500 p-3 rounded-lg shadow-md mr-1" onPress={() => setEditingDeviceId(null)}>
                      <Text className="text-center text-white font-bold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-green-500 p-3 rounded-lg shadow-md ml-1" onPress={() => handleSaveEdit(device.deviceId)}>
                      <Text className="text-center text-white font-bold">Save</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity className="w-full bg-red-700 p-2 rounded-lg shadow-md" onPress={() => deleteDevice(device.deviceId)}>
                    <Text className="text-center text-white font-bold">Delete Device</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

      <TouchableOpacity
        className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4"
        onPress={() => {
          setModalVisible(true);
          scanAndConnect();
        }}
      >
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
