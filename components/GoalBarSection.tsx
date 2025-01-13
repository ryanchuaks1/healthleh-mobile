import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface GoalBarSectionProps {
  currentWeight: string;
  weightGoal: string;
}

const GoalBarSection: React.FC<GoalBarSectionProps> = ({ currentWeight, weightGoal }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-orange-800 p-4 rounded-lg shadow-md mb-4"
      onPress={() => router.push("/goal-chart")}
    >
      <View className="flex flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold">Current</Text>
        <Text className="text-white text-lg">{currentWeight}</Text>
      </View>
      <View className="flex flex-row justify-between items-center mt-2">
        <Text className="text-white text-lg font-bold">Goal</Text>
        <Text className="text-white text-lg">{weightGoal}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default GoalBarSection;
