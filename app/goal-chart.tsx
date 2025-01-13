import React from "react";
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const GoalChartScreen: React.FC = () => {
  const router = useRouter();

  // Mock data for progress over time
  const goalData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [75, 74, 73, 72, 71, 70], // Example weights or goals achieved
        color: () => `rgba(255, 165, 0, 1)`, // Line color
        strokeWidth: 2, // Line thickness
      },
    ],
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <TouchableOpacity className="bg-orange-800 p-4 rounded-lg shadow-md mb-6" onPress={() => router.push("/goal-chart")}>
        <View className="flex flex-row justify-between items-center">
          <Text className="text-white text-lg font-bold">Current</Text>
          <Text className="text-white text-lg">70 kg</Text> {/* Mock data */}
        </View>
        <View className="flex flex-row justify-between items-center mt-2">
          <Text className="text-white text-lg font-bold">Goal</Text>
          <Text className="text-white text-lg">65 kg</Text> {/* Mock data */}
        </View>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-orange-800 text-center mb-6">Goal Progress</Text>
      <LineChart
        data={goalData}
        width={screenWidth - 32} // Full width with padding
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa500",
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      <TouchableOpacity className="w-full bg-slate-500 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GoalChartScreen;
