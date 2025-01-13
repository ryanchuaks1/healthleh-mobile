import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface Device {
  id: string;
  name: string;
  status: string;
}

interface DeviceSectionProps {
  devices: Device[];
}

const DeviceSection: React.FC<DeviceSectionProps> = ({ devices }) => {
  const router = useRouter();

  return (
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
      <TouchableOpacity
        className="w-full bg-orange-800 p-4 rounded-lg shadow-md mt-4"
        onPress={() => router.push("/device")}
      >
        <Text className="text-center text-white font-bold">Manage Devices</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DeviceSection;
