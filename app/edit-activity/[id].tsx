import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
// Import a slider package. You may need to install @react-native-community/slider if not already installed.
import Slider from "@react-native-community/slider";
// Import Picker for the dropdown
import { Picker } from "@react-native-picker/picker";
import config from "../../config";
import { useLocalSearchParams, router } from "expo-router";

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

const EditActivity: React.FC = () => {
  const params = useLocalSearchParams();
  const id: string = typeof params === "string" ? params : (params as { id: string }).id;

  const [activity, setActivity] = useState({
    phoneNumber: "",
    exerciseType: "",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "1", // default as string
    rating: "1", // default as string
    distanceFromHome: "",
  });
  // Use state for Picker selection
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

  // New function to call the calorie calculation endpoint
  const handleCalculateCalories = async (): Promise<void> => {
    // Validate required fields before API call
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

  // Validate if required fields are available for calorie calculation
  const isValidForCalculation =
    activity.exerciseType.trim() !== "" &&
    activity.durationMinutes.trim() !== "" &&
    !isNaN(parseInt(activity.durationMinutes)) &&
    parseInt(activity.durationMinutes) > 0;

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">Edit Exercise</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          {/* Dropdown for common exercises */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Select Common Exercise</Text>
            <Picker
              selectedValue={selectedExercise}
              onValueChange={(itemValue) => {
                setSelectedExercise(itemValue);
                if (itemValue !== "Other") {
                  // Update exercise type with the selected common exercise.
                  setActivity({ ...activity, exerciseType: itemValue });
                }
              }}
            >
              {commonExercises.map((exercise) => (
                <Picker.Item label={exercise} value={exercise} key={exercise} />
              ))}
            </Picker>
          </View>

          {/* Custom input for exercise type */}
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Exercise Type (or enter custom)</Text>
            <TextInput
              placeholder="Custom Exercise Type (if not in dropdown)"
              value={activity.exerciseType}
              onChangeText={(text) => setActivity({ ...activity, exerciseType: text })}
              className="border border-gray-300 rounded p-2"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Duration (minutes)</Text>
            <TextInput
              placeholder="Duration (minutes)"
              value={activity.durationMinutes}
              onChangeText={(text) => setActivity({ ...activity, durationMinutes: text })}
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

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Calories Burned</Text>
            <TextInput
              placeholder="Calories Burned"
              value={activity.caloriesBurned}
              editable={false} // read-only since it's calculated
              className="border border-gray-300 rounded p-2 bg-gray-200"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Intensity (1-10): {activity.intensity}</Text>
            <Slider
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={parseInt(activity.intensity) || 1}
              onValueChange={(value) => setActivity({ ...activity, intensity: value.toString() })}
              style={{ width: "100%", height: 40 }}
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Rating (1-5): {activity.rating}</Text>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={parseInt(activity.rating) || 1}
              onValueChange={(value) => setActivity({ ...activity, rating: value.toString() })}
              style={{ width: "100%", height: 40 }}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Distance From Home</Text>
            <TextInput
              placeholder="Distance From Home"
              value={activity.distanceFromHome}
              onChangeText={(text) => setActivity({ ...activity, distanceFromHome: text })}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2"
            />
          </View>

          <TouchableOpacity className="bg-green-600 p-3 rounded mb-2" onPress={handleUpdate}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Update Exercise</Text>}
          </TouchableOpacity>

          <TouchableOpacity className="bg-red-600 p-3 rounded mb-2" onPress={handleDelete}>
            <Text className="text-white text-center font-semibold">Delete Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default EditActivity;
