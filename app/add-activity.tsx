import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import config from "../config";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";

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

const AddActivity: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("81228470");
  const [exerciseType, setExerciseType] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<string>("Other");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(1);
  const [rating, setRating] = useState<number>(1);
  const [distanceFromHome, setDistanceFromHome] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  // Function to calculate calories via API
  const handleCalculateCalories = async (): Promise<void> => {
    // Validate required fields before API call
    if (exerciseType.trim() === "" || durationMinutes.trim() === "" || isNaN(parseInt(durationMinutes)) || parseInt(durationMinutes) <= 0) {
      displayMessage("Please provide a valid exercise type and duration.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_AI_URL}/calculateCalories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: exerciseType,
          duration: parseInt(durationMinutes),
          intensity: intensity,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCaloriesBurned(data.caloriesBurned.toString());
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

  // Determine if fields are valid for calorie calculation
  const isValidForCalculation =
    exerciseType.trim() !== "" && durationMinutes.trim() !== "" && !isNaN(parseInt(durationMinutes)) && parseInt(durationMinutes) > 0;

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
          intensity, // already a number
          rating, // already a number
          distanceFromHome: parseFloat(distanceFromHome),
        }),
      });
      if (response.ok) {
        displayMessage("Exercise logged successfully!");
        setTimeout(() => {
          router.push("/activities");
        }, 200);
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

      {/* Dropdown for common exercises */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Select Common Exercise</Text>
        <Picker
          selectedValue={selectedExercise}
          onValueChange={(itemValue) => {
            setSelectedExercise(itemValue);
            if (itemValue !== "Other") {
              setExerciseType(itemValue);
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
          value={caloriesBurned}
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2 bg-gray-200"
          editable={false}
        />
      </View>

      {/* Intensity Slider */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Intensity (1-10): {intensity}</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={intensity}
          onValueChange={(value) => setIntensity(value)}
          style={{ width: "100%", height: 40 }}
        />
      </View>

      {/* Rating Slider */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Rating (1-5): {rating}</Text>
        <Slider minimumValue={1} maximumValue={5} step={1} value={rating} onValueChange={(value) => setRating(value)} style={{ width: "100%", height: 40 }} />
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
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Add Exercise</Text>}
      </TouchableOpacity>

      <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
        <Text className="text-white text-center font-semibold">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddActivity;
