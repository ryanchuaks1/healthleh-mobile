// ExerciseSelection.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { router } from "expo-router";
import { useActivity } from "./ActivityContext";

const ExerciseSelection: React.FC = () => {
  const { activity, setActivity } = useActivity();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [customExercise, setCustomExercise] = useState<string>("");
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<{
    recommendation_1: string;
    recommendation_2: string;
    recommendation_3: string;
  } | null>(null);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const fetchRecommendations = async (phoneNumber: string) => {
    try {
      setRecLoading(true);
      // 1. Fetch the user's last 14 activities.
      const activitiesResponse = await fetch(`${config.API_BASE_URL}/api/user-exercises/last/${phoneNumber}`);
      if (!activitiesResponse.ok) {
        displayMessage("Error fetching last 14 activities.");
        return;
      }
      const activitiesData = await activitiesResponse.json();

      // 2. Build dynamic values.
      const timeTriggered = new Date().toISOString();
      const last14Distances = activitiesData.map((item: any) => item.distanceFromHome).join(",");
      const last14ActivityPerformed = activitiesData.map((item: any) => item.exerciseType).join(",");
      const last14ActivityRating = activitiesData.map((item: any) => item.rating).join(",");

      // 3. Build request body.
      const requestBody = {
        timeTriggered,
        userDistanceFromHome: activity.distanceFromHome || "2km",
        last14Distances,
        connectedIotDevices: "Phone, Watch",
        last14UsedIotDevices: '{ "Phone": "full screen notification", "Watch": "vibrate and notify" }',
        last14ActivityPerformed,
        last14ActivityRating,
      };

      // 4. Call recommendation API.
      const response = await fetch(`${config.API_AI_URL}/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.exercise_recommendation);
        // Pre-select the first recommendation.
        setSelectedExercise(data.exercise_recommendation.recommendation_1);
        setActivity((prev: any) => ({ ...prev, exerciseType: data.exercise_recommendation.recommendation_1 }));
      } else {
        displayMessage("Error fetching recommendations.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("userPhoneNumber");
        if (storedPhone) {
          setActivity((prev) => ({ ...prev, phoneNumber: storedPhone }));
          fetchRecommendations(storedPhone);
        } else {
          console.error("Phone number not found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error retrieving phone number:", error);
      }
    };
    getPhoneNumber();
  }, []);

  // Update context if the custom exercise changes and "Custom" is selected.
  useEffect(() => {
    if (selectedExercise === "Custom") {
      setActivity((prev) => ({ ...prev, exerciseType: customExercise }));
    }
  }, [customExercise, selectedExercise]);

  const handleNext = () => {
    if (!activity.exerciseType.trim()) {
      displayMessage("Please select an exercise type.");
      return;
    }
    router.push("/timer");
  };

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 24 }} className="flex-1">
        <Text className="text-3xl font-bold text-orange-800 mb-4 text-center pt-16">Select Exercise</Text>
        {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

        <View className="mb-4">
          <Text className="text-gray-700 mb-1 text-lg">Recommended Exercises!</Text>
          <Text className="text-sm text-center text-gray-500 mb-2">
            These are AI recommended exercises based on your history but feel free to choose a custom option.
          </Text>
          {recLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <View className="flex-row justify-between">
              {[recommendations?.recommendation_1, recommendations?.recommendation_2, recommendations?.recommendation_3].map((rec, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedExercise(rec!);
                    setActivity((prev: any) => ({ ...prev, exerciseType: rec! }));
                  }}
                  className={`flex-1 m-1 p-3 rounded border ${
                    selectedExercise === rec ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                  }`}
                >
                  <Text className={`text-center font-semibold ${selectedExercise === rec ? "text-white" : "text-gray-700"}`}>{rec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Custom Option */}
          <TouchableOpacity
            onPress={() => {
              setSelectedExercise("Custom");
              setActivity((prev) => ({ ...prev, exerciseType: customExercise }));
            }}
            className={`m-1 p-3 rounded border ${
              selectedExercise === "Custom" ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
            }`}
          >
            <Text className={`text-center font-semibold ${selectedExercise === "Custom" ? "text-white" : "text-gray-700"}`}>
              Custom
            </Text>
          </TouchableOpacity>
          {selectedExercise === "Custom" && (
            <TextInput
              placeholder="Enter custom exercise type"
              value={customExercise}
              onChangeText={setCustomExercise}
              className="border border-gray-300 rounded p-2 mt-2 bg-white"
            />
          )}
        </View>
      </ScrollView>
      <View className="p-6">
        <TouchableOpacity onPress={handleNext} className="bg-green-600 p-3 rounded mb-2">
          <Text className="text-white text-center font-semibold">Next</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-500 p-3 rounded">
          <Text className="text-white text-center font-semibold">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ExerciseSelection;
