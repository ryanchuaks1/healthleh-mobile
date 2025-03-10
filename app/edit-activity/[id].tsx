import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import config from "../../config";
import { useLocalSearchParams, router } from "expo-router";

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
  return text.replace(/[^0-9]/g, "");
};

const sanitizeDecimal = (text: string): string => {
  let sanitized = text.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts.shift() + "." + parts.join("");
  }
  return sanitized;
};

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

const EditActivity: React.FC = () => {
  const params = useLocalSearchParams();
  const id: string = typeof params === "string" ? params : (params as { id: string }).id;

  const [activity, setActivity] = useState({
    phoneNumber: "",
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

  useEffect(() => {
    if (id) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/id/${id}`);
      if (!response.ok) throw new Error("Failed to fetch activity details");
      const data: Activity = await response.json();
      setActivity({
        phoneNumber: data.phoneNumber || "",
        exerciseType: data.exerciseType || "",
        durationMinutes: data.durationMinutes?.toString() || "",
        caloriesBurned: data.caloriesBurned?.toString() || "",
        intensity: data.intensity?.toString() || "1",
        rating: data.rating?.toString() || "1",
        distanceFromHome: data.distanceFromHome?.toString() || "",
      });
      // If the fetched exercise is in our common list, select it; otherwise use "Other".
      setSelectedExercise(commonExercises.includes(data.exerciseType) ? data.exerciseType : "Other");
    } catch (error: any) {
      displayMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    const isFormValid = activity.exerciseType.trim() !== "" && activity.durationMinutes.trim() !== "" && activity.caloriesBurned.trim() !== "";
    if (!isFormValid) {
      displayMessage("Please complete all required fields before updating.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/${id}`, {
        method: "PUT",
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
        displayMessage("Activity updated successfully!");
        setTimeout(() => {
          router.push("/activities");
        }, 200);
      } else {
        displayMessage("Error updating activity.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        displayMessage("Activity deleted successfully!");
        setTimeout(() => {
          router.push("/activities");
        }, 200);
      } else {
        displayMessage("Error deleting activity.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger calorie calculation.
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
          caloriesBurned: data.caloriesBurned.toString(),
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

  const isValidForCalculation =
    activity.exerciseType.trim() !== "" &&
    activity.durationMinutes.trim() !== "" &&
    !isNaN(parseInt(activity.durationMinutes)) &&
    parseInt(activity.durationMinutes) > 0;

  const isFormValid =
    activity.exerciseType.trim() !== "" &&
    activity.durationMinutes.trim() !== "" &&
    activity.caloriesBurned.trim() !== "" &&
    activity.distanceFromHome.trim() !== "";

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">Edit Exercise</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          {/* Common Exercise Picker */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Select Common Exercise</Text>
            <View className="border border-gray-300 rounded bg-white">
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
          </View>

          {/* Custom Exercise Input */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Exercise Type (or enter custom)</Text>
            <TextInput
              placeholder="Custom Exercise Type (if not in dropdown)"
              value={activity.exerciseType}
              onChangeText={(text) => setActivity((prev) => ({ ...prev, exerciseType: text }))}
              className="border border-gray-300 rounded p-2 bg-white"
            />
          </View>

          {/* Duration Input */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Duration (minutes)</Text>
            <TextInput
              placeholder="Duration (minutes)"
              value={activity.durationMinutes}
              onChangeText={(text) => setActivity((prev) => ({ ...prev, durationMinutes: sanitizeNumeric(text) }))}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2 bg-white"
            />
          </View>

          {/* Calculate Calories Button */}
          <TouchableOpacity
            className={`p-3 rounded mb-3 ${isValidForCalculation ? "bg-blue-600" : "bg-gray-400"}`}
            onPress={handleCalculateCalories}
            disabled={!isValidForCalculation}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Calculate Calories</Text>}
          </TouchableOpacity>

          {/* Calories Burned Output */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Calories Burned</Text>
            <TextInput
              placeholder="Calories Burned"
              value={activity.caloriesBurned}
              editable={false}
              className="border border-gray-300 rounded p-2 bg-gray-200"
            />
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

          {/* Distance Input */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Distance From Home</Text>
            <TextInput
              placeholder="Distance From Home"
              value={activity.distanceFromHome}
              onChangeText={(text) => setActivity((prev) => ({ ...prev, distanceFromHome: sanitizeDecimal(text) }))}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2 bg-white"
            />
          </View>

          {/* Update Exercise Button */}
          <TouchableOpacity className={`bg-green-600 p-3 rounded mb-2 ${!isFormValid ? "opacity-50" : ""}`} onPress={handleUpdate} disabled={!isFormValid}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Update Exercise</Text>}
          </TouchableOpacity>

          {/* Delete Exercise Button */}
          <TouchableOpacity className="bg-red-600 p-3 rounded mb-2" onPress={handleDelete}>
            <Text className="text-white text-center font-semibold">Delete Exercise</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default EditActivity;
