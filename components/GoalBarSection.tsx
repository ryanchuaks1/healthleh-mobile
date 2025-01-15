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
      <View className="items-center">
        <Text className="text-white text-lg font-bold">Set Goals</Text>
      </View>

    </TouchableOpacity>
  );
};

export default GoalBarSection;
