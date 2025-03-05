import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import config from "../config";
import { router } from "expo-router";

// List of common exercises with an "Other" option for custom input.
const commonExercises = [
  "Longer Distance Walking",
  "Paced Walking",
  "Climbing Stairs",
  "Jumping Jacks",
  "Running",
  "Burpees",
  "Cycling",
  "Swimming",
  "Elliptical",
  "Rowing",
  "Yoga",
  "Pilates",
  "Strength Training",
  "HIIT",
  "Dancing",
  "Hiking",
  "Other",
];

// Helper functions to sanitize input.
const sanitizeNumeric = (text: string): string => {
  // Allow only digits.
  return text.replace(/[^0-9]/g, "");
};

const sanitizeDecimal = (text: string): string => {
  // Allow only digits and a single decimal point.
  let sanitized = text.replace(/[^0-9.]/g, "");
  // Remove additional dots if any.
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts.shift() + "." + parts.join("");
  }
  return sanitized;
};

const AddActivity: React.FC = () => {
  const [activity, setActivity] = useState({
    phoneNumber: "81228470",
    exerciseType: "",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "1",
    rating: "1",
    distanceFromHome: "",
  });
  const [selectedExercise, setSelectedExercise] = useState<string>("Other");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleCalculateCalories = async (): Promise<void> => {
    if (
      activity.exerciseType.trim() === "" ||
      activity.durationMinutes.trim() === "" ||
      isNaN(parseInt(activity.durationMinutes)) ||
      parseInt(activity.durationMinutes) <= 0
    ) {
      displayMessage("Please provide a valid exercise type and duration.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_AI_URL}/calculateCalories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: activity.exerciseType,
          duration: parseInt(activity.durationMinutes),
          intensity: parseInt(activity.intensity),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setActivity((prev) => ({
          ...prev,
          caloriesBurned: Math.round(data.caloriesBurned).toString(),
        }));
        displayMessage("Calorie calculation successful!");
      } else {
        displayMessage("Error calculating calories.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate if required fields are available for calorie calculation.
  const isValidForCalculation =
    activity.exerciseType.trim() !== "" &&
    activity.durationMinutes.trim() !== "" &&
    !isNaN(parseInt(activity.durationMinutes)) &&
    parseInt(activity.durationMinutes) > 0;

  const isFormValid = activity.exerciseType.trim() !== "" && activity.durationMinutes.trim() !== "" && activity.caloriesBurned.trim() !== "" && activity.distanceFromHome.trim() !== "";

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log("Activity to log:", activity);
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: activity.phoneNumber,
          exerciseType: activity.exerciseType,
          durationMinutes: parseInt(activity.durationMinutes),
          caloriesBurned: parseInt(activity.caloriesBurned),
          intensity: parseInt(activity.intensity),
          rating: parseInt(activity.rating),
          distanceFromHome: parseFloat(activity.distanceFromHome),
        }),
      });
      if (response.ok) {
        displayMessage("Exercise logged successfully!");
        setTimeout(() => {
          router.push("/activities");
        }, 200);
      } else {
        displayMessage("Error logging exercise.");
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

      {/* Dropdown for common exercises */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Select Common Exercise</Text>
        <Picker
          selectedValue={selectedExercise}
          onValueChange={(itemValue) => {
            setSelectedExercise(itemValue);
            if (itemValue !== "Other") {
              setActivity((prev) => ({ ...prev, exerciseType: itemValue }));
            }
          }}
        >
          {commonExercises.map((exercise) => (
            <Picker.Item label={exercise} value={exercise} key={exercise} />
          ))}
        </Picker>
      </View>

      {/* Custom exercise input */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Exercise Type (or enter custom)</Text>
        <TextInput
          placeholder="Custom Exercise Type (if not in dropdown)"
          value={activity.exerciseType}
          onChangeText={(text) => setActivity((prev) => ({ ...prev, exerciseType: text }))}
          className="border border-gray-300 rounded p-2"
        />
      </View>

      {/* Duration input with numeric sanitization */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Duration (minutes)</Text>
        <TextInput
          placeholder="Duration (minutes)"
          value={activity.durationMinutes}
          onChangeText={(text) =>
            setActivity((prev) => ({
              ...prev,
              durationMinutes: sanitizeNumeric(text),
            }))
          }
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      {/* Button to trigger calorie calculation */}
      <TouchableOpacity
        className={`p-3 rounded mb-3 ${isValidForCalculation ? "bg-blue-600" : "bg-gray-400"}`}
        onPress={handleCalculateCalories}
        disabled={!isValidForCalculation}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Calculate Calories</Text>}
      </TouchableOpacity>

      {/* Calories Burned output */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Calories Burned</Text>
        <TextInput placeholder="Calories Burned" value={activity.caloriesBurned} editable={false} className="border border-gray-300 rounded p-2 bg-gray-200" />
      </View>

      {/* Intensity Slider */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Intensity (1-10): {activity.intensity}</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={parseInt(activity.intensity) || 1}
          onValueChange={(value) => setActivity((prev) => ({ ...prev, intensity: value.toString() }))}
          style={{ width: "100%", height: 40 }}
        />
      </View>

      {/* Rating Slider */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Rating (1-5): {activity.rating}</Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={parseInt(activity.rating) || 1}
          onValueChange={(value) => setActivity((prev) => ({ ...prev, rating: value.toString() }))}
          style={{ width: "100%", height: 40 }}
        />
      </View>

      {/* Distance input with decimal sanitization */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Distance From Home</Text>
        <TextInput
          placeholder="Distance From Home"
          value={activity.distanceFromHome}
          onChangeText={(text) =>
            setActivity((prev) => ({
              ...prev,
              distanceFromHome: sanitizeDecimal(text),
            }))
          }
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
        />
      </View>

      {/* Add Exercise button disabled if required fields are missing */}
      <TouchableOpacity className={`bg-green-600 p-3 rounded mb-2 ${!isFormValid ? "opacity-50" : ""}`} onPress={handleSubmit} disabled={!isFormValid}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Add Exercise</Text>}
      </TouchableOpacity>

      <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
        <Text className="text-white text-center font-semibold">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddActivity;
