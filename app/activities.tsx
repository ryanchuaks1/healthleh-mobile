import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, SectionList } from "react-native";
import config from "../config";
import { router } from "expo-router";

// Move the interface outside the component
interface Activity {
  id: number;
  phoneNumber: string;
  exerciseType: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: number;
  rating: number;
  distanceFromHome: number;
  exerciseDate: string;
}

const Activities: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("81228470");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    if (phoneNumber) fetchActivities();
  }, [phoneNumber]);

  const fetchActivities = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/${phoneNumber}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data: Activity[] = await response.json();
      if (data.length === 0) {
        displayMessage("No activities found.");
      }
      setActivities(data);
    } catch (error: any) {
      displayMessage(`Error fetching activities: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const groupedActivities = activities.reduce((groups: { [key: number]: Activity[] }, activity) => {
    const dateObj = new Date(activity.exerciseDate);
    const dateKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedActivities)
    .map(Number)
    .sort((a, b) => b - a);

  const sections = sortedDates.map((dateKey) => ({
    title: new Date(dateKey).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    data: groupedActivities[dateKey],
  }));

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4">User Exercise Logging</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      <TouchableOpacity
        className="bg-orange-800 p-3 rounded-lg shadow-md my-1"
        onPress={() => {
          router.push("/add-activity");
        }}
      >
        <Text className="text-center text-white font-bold">Add Exercise</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-slate-600 p-3 rounded-lg shadow-md my-1"
        onPress={() => {
          router.push("/home");
        }}
      >
        <Text className="text-center text-white font-bold">Back to Home</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#4CAF50" />}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section: { title } }) => (
          <View className="p-1 border-b border-gray-300 my-2">
            <Text className="text-center text-gray-800 text-sm font-bold">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          // Display time using the device's local time
          const time = new Date(item.exerciseDate).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <TouchableOpacity onPress={() => router.push({ pathname: "/edit-activity/[id]", params: { id: item.id } })}>
              <View className="p-2 mb-1">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-semibold text-gray-800">{item.exerciseType}</Text>
                  <Text className="text-xs text-gray-500">{time}</Text>
                </View>
                <View className="mt-1">
                  <Text className="text-sm text-gray-700">
                    Duration: <Text className="font-medium">{item.durationMinutes} mins</Text>
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Calories: <Text className="font-medium">{item.caloriesBurned}</Text>
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Intensity: <Text className="font-medium">{item.intensity}/10</Text>
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Rating: <Text className="font-medium">{item.rating}/5</Text>
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Distance: <Text className="font-medium">{item.distanceFromHome} km</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => !loading && <Text className="text-center text-gray-600">No activities found.</Text>}
      />
    </ScrollView>
  );
};

export default Activities;
