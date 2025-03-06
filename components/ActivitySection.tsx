import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface ActivitySectionProps {
  steps: number;
  lastActivity: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ steps, lastActivity }) => {
  const router = useRouter();

  return (
    <>
      <Text className="text-xl font-bold text-orange-700 mb-4">Your Activity</Text>
      <View className="flex-row justify-between mb-4">
        <View className="bg-orange-400 rounded-lg shadow-md p-4 flex-1 mr-2">
          <Text className="text-white text-lg font-bold">Steps 👟</Text>
          <Text className="text-white text-md mt-1">{steps} steps</Text>
        </View>
        <View className="bg-green-500 rounded-lg shadow-md p-4 flex-1 ml-2">
          <Text className="text-white text-lg font-bold">Kcal Burned 🔥</Text>
          <Text className="text-white text-md mt-1">200</Text>
        </View>
      </View>
      <TouchableOpacity className="mb-6" onPress={() => router.push("/activities")}>
        <View className="bg-blue-500 rounded-lg shadow-md p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">Last Activity</Text>
            <Text className="text-white text-md mt-2">{lastActivity}</Text>
          </View>
          <Text className="text-white text-3xl">{">"}</Text>
        </View>
      </TouchableOpacity>
    </>
  );
};

export default ActivitySection;
