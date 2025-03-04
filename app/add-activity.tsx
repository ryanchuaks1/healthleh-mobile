import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import config from "../config";
import { router } from "expo-router";

const AddActivity: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("81228470");
  const [exerciseType, setExerciseType] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("");
  const [intensity, setIntensity] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [distanceFromHome, setDistanceFromHome] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          exerciseType,
          durationMinutes: parseInt(durationMinutes),
          caloriesBurned: parseInt(caloriesBurned),
          intensity: parseInt(intensity),
          rating: parseInt(rating),
          distanceFromHome: parseFloat(distanceFromHome),
        }),
      });
      if (response.ok) {
        displayMessage("Exercise logged successfully!");
        // Optionally navigate back to the main page after a short delay
        setTimeout(() => {
          router.push("/activities");
        }, 1500);
      } else {
        displayMessage("Error logging exercise");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">Add Exercise</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Exercise Type</Text>
        <TextInput
          placeholder="Exercise Type"
          value={exerciseType}
          onChangeText={setExerciseType}
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <View className="mb-3"> 
        <Text className="text-gray-700 mb-1">Duration (minutes)</Text>
        <TextInput
          placeholder="Duration (minutes)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Calories Burned</Text>
        <TextInput
          placeholder="Calories Burned"
          value={caloriesBurned}
          onChangeText={setCaloriesBurned}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Intensity (1-10)</Text>
        <TextInput
          placeholder="Intensity (1-10)"
          value={intensity}
          onChangeText={setIntensity}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Rating (1-5)</Text>
        <TextInput
          placeholder="Rating (1-5)"
          value={rating}
          onChangeText={setRating}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Distance From Home</Text>
        <TextInput
          placeholder="Distance From Home"
          value={distanceFromHome}
          onChangeText={setDistanceFromHome}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      <TouchableOpacity className="bg-green-600 p-3 rounded mb-2" onPress={handleSubmit}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold">Add Exercise</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
        <Text className="text-white text-center font-semibold">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddActivity;
