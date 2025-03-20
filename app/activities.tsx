import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, SectionList } from "react-native";
import config from "../config";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface Goal {
  Goal: any;
  GoalType: any;
  id: number;
  phoneNumber: string;
  description: string;
  target: string;
  // add any other fields your goal has
}

const Activities: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [opinion, setOpinion] = useState<{ activity_opinion: string; improvement_suggestions: string[] } | null>(null);
  const [loadingOpinion, setLoadingOpinion] = useState<boolean>(false);
  const [opinionFetched, setOpinionFetched] = useState<boolean>(false);

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  // Retrieve phone number from AsyncStorage
  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("userPhoneNumber");
        if (storedPhone) {
          setPhoneNumber(storedPhone);
        } else {
          console.error("Phone number not found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error retrieving phone number:", error);
      }
    };
    getPhoneNumber();
  }, []);

  // Fetch activities and goals once phoneNumber is available
  useEffect(() => {
    if (phoneNumber) {
      fetchActivities();
      fetchGoals();
    }
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

  // Fetch user goals
  const fetchGoals = async (): Promise<void> => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/goals/${phoneNumber}`);
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data: Goal[] = await response.json();
      console.log("Goals fetched:", data);
      setGoals(data);
    } catch (error: any) {
      displayMessage(`Error fetching goals: ${error.message}`);
    }
  };

  // Group activities by date
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

  // Update daily record (existing functionality)
  useEffect(() => {
    if (!phoneNumber || activities.length === 0) return;
    const updateDailyRecord = async () => {
      for (const dateKey in groupedActivities) {
        const group = groupedActivities[dateKey];
        const totalCalories = group.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
        const totalDuration = group.reduce((sum, activity) => sum + activity.durationMinutes, 0);
        const recordDate = new Date(Number(dateKey)).toISOString().split("T")[0];
        try {
          const res = await fetch(`${config.API_BASE_URL}/api/dailyrecords/${phoneNumber}/${recordDate}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              totalCaloriesBurned: totalCalories,
              exerciseDurationMinutes: totalDuration,
            }),
          });
          if (!res.ok) {
            console.error(`Failed to update daily record for ${recordDate}`);
          }
        } catch (error) {
          console.error("Error updating daily record:", error);
        }
      }
    };
    updateDailyRecord();
  }, [phoneNumber, activities, groupedActivities]);

  // New function: Call the activityOpinion endpoint with goals included
  const fetchOpinion = async () => {
    if (activities.length === 0) {
      displayMessage("No activities available to analyze.");
      return;
    }
    setLoadingOpinion(true);
    try {
      // Sort activities by date (latest first) and take up to 14 records
      const sortedActivities = [...activities].sort((a, b) => new Date(b.exerciseDate).getTime() - new Date(a.exerciseDate).getTime());
      const last14 = sortedActivities.slice(0, 14);
      const last14Activities = last14.map((act) => act.exerciseType).join(", ");
      const last14Ratings = last14.map((act) => act.rating).join(", ");
      const last14Times = last14
        .map((act) =>
          new Date(act.exerciseDate).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        )
        .join(", ");

      // Convert goals array to a descriptive string (adjust as needed)
      console.log("Goals:", goals);
      const goalsString = goals.map((goal) => `${goal.GoalType}: ${goal.Goal}`).join(", ");
      console.log("Goals string:", goalsString);

      const payload = {
        last14Activities,
        last14Ratings,
        last14Times,
        goals: goalsString, // use the string here
      };

      const response = await fetch(`${config.API_AI_URL}/activityOpinion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity opinion");
      }
      const data = await response.json();
      setOpinion(data);
    } catch (error: any) {
      displayMessage(`Error fetching opinion: ${error.message}`);
    } finally {
      setLoadingOpinion(false);
      setOpinionFetched(true);
    }
  };

  // Automatically run fetchOpinion when activities (or goals) update and opinion hasn't been fetched yet
  useEffect(() => {
    if (activities.length > 0 && !opinionFetched && goals.length > 0) {
      fetchOpinion();
    }
  }, [activities, opinionFetched, goals]);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4">User Exercise Logging</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      <TouchableOpacity className="bg-orange-800 p-3 rounded-lg shadow-md my-1" onPress={() => router.push("/exercise-selection")}>
        <Text className="text-center text-white font-bold">Add Exercise</Text>
      </TouchableOpacity>
      <TouchableOpacity className="bg-slate-600 p-3 rounded-lg shadow-md my-1" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to Home</Text>
      </TouchableOpacity>

      {loadingOpinion && <ActivityIndicator size="large" color="#0000ff" />}
      {opinion && (
        <View className="my-4 p-4 bg-white rounded shadow">
          <Text className="text-lg font-bold mb-2">Activity Opinion:</Text>
          <Text className="mb-2">{opinion.activity_opinion}</Text>
          <Text className="text-lg font-bold mb-2">Improvement Suggestions:</Text>
          {opinion.improvement_suggestions.map((suggestion, index) => (
            <Text key={index} className="mb-1">
              - {suggestion}
            </Text>
          ))}
        </View>
      )}

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
