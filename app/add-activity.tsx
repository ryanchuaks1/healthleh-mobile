import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import config from "../config";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [activity, setActivity] = useState({
    phoneNumber: "",
    exerciseType: "",
    durationMinutes: "", // Set by the stopwatch.
    caloriesBurned: "",
    intensity: "1",
    rating: "1",
    distanceFromHome: "", // Will be set to a random value.
  });
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [customExercise, setCustomExercise] = useState<string>("");

  // Separate loading states.
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  const [message, setMessage] = useState<string>("");
  const [recommendations, setRecommendations] = useState<{
    recommendation_1: string;
    recommendation_2: string;
    recommendation_3: string;
  } | null>(null);

  // Stopwatch state: elapsed time in seconds and running flag.
  const [stopwatch, setStopwatch] = useState({ isRunning: false, elapsed: 0 });

  // Random distance state.
  const [randomDistance, setRandomDistance] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  // Generate random distance between 0.1 and 3 (one decimal) on mount.
  useEffect(() => {
    const random = (Math.random() * (3 - 0.1) + 0.1).toFixed(1);
    setRandomDistance(random);
    setActivity((prev) => ({ ...prev, distanceFromHome: random }));
  }, []);

  // Retrieve phone number and fetch recommendations.
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

  // Stopwatch effect: update elapsed time every second if running.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stopwatch.isRunning) {
      interval = setInterval(() => {
        setStopwatch((prev) => ({ ...prev, elapsed: prev.elapsed + 1 }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatch.isRunning]);

  // Helper to format seconds into HH:MM:SS.
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
      console.log("Fetched last 14 activities:", activitiesData);

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
        // Pre-select first recommendation.
        setSelectedExercise(data.exercise_recommendation.recommendation_1);
      } else {
        displayMessage("Error fetching recommendations.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setRecLoading(false);
    }
  };

  // When a recommendation button is pressed.
  const handleExerciseChange = (value: string) => {
    setSelectedExercise(value);
    if (value !== "Custom") {
      setActivity((prev) => ({ ...prev, exerciseType: value }));
    } else {
      setActivity((prev) => ({ ...prev, exerciseType: customExercise }));
    }
  };

  // Update exerciseType when custom field changes.
  useEffect(() => {
    if (selectedExercise === "Custom") {
      setActivity((prev) => ({ ...prev, exerciseType: customExercise }));
    }
  }, [customExercise, selectedExercise]);

  // Calorie calculation function.
  const handleCalculateCalories = async (): Promise<void> => {
    // Only calculate if valid.
    if (
      activity.exerciseType.trim() === "" ||
      activity.durationMinutes.trim() === "" ||
      isNaN(parseInt(activity.durationMinutes)) ||
      parseInt(activity.durationMinutes) <= 0
    ) {
      return;
    }
    try {
      setCalcLoading(true);
      console.log("Calculating calories for:", activity);
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
      } else {
        displayMessage("Error calculating calories.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setCalcLoading(false);
    }
  };

  // Automatically trigger calorie calculation when relevant fields change.
  useEffect(() => {
    setSubmitLoading(true);
    const timer = setTimeout(() => {
      if (
        activity.exerciseType.trim() !== "" &&
        activity.durationMinutes.trim() !== "" &&
        !isNaN(parseFloat(activity.durationMinutes)) &&
        parseFloat(activity.durationMinutes) > 0
      ) {
        handleCalculateCalories().then(() => setSubmitLoading(false));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [activity.exerciseType, activity.durationMinutes, activity.intensity]);

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

  const handleSubmit = async (): Promise<void> => {
    try {
      setSubmitLoading(true);
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
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">Add Exercise</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {/* Recommendations Section */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Recommended Exercises</Text>
        {recLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <View className="flex-row justify-between">
            {[recommendations?.recommendation_1, recommendations?.recommendation_2, recommendations?.recommendation_3].map((rec, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedExercise(rec!);
                  setActivity((prev) => ({ ...prev, exerciseType: rec! }));
                }}
                className={`flex-1 m-1 p-3 rounded border ${selectedExercise === rec ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
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
          className={`m-1 p-3 rounded border ${selectedExercise === "Custom" ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
        >
          <Text className={`text-center font-semibold ${selectedExercise === "Custom" ? "text-white" : "text-gray-700"}`}>Custom</Text>
        </TouchableOpacity>
        {selectedExercise === "Custom" && (
          <TextInput
            placeholder="Enter custom exercise type"
            value={customExercise}
            onChangeText={(text) => {
              setCustomExercise(text);
              setActivity((prev) => ({ ...prev, exerciseType: text }));
            }}
            className="border border-gray-300 rounded p-2 mt-2 bg-white"
          />
        )}
      </View>

      {/* Stopwatch for Duration */}
      <View className="mb-4 w-full">
        <Text className="text-gray-700 mb-1 text-center">Duration</Text>
        <View className="w-full items-center">
          <Text className="text-3xl font-bold mb-2">{formatTime(stopwatch.elapsed)}</Text>
        </View>
        {/* New Icon Buttons to Adjust Timer */}
        <View className="flex-row justify-center space-x-3">
          <TouchableOpacity
            className="bg-blue-600 p-3 rounded flex-1"
            onPress={() => {
              // Toggle stopwatch; when stopping, update durationMinutes.
              setStopwatch((prev) => {
                if (prev.isRunning) {
                  const minutes = Math.max(1, Math.round(prev.elapsed / 60));
                  setActivity((a) => ({ ...a, durationMinutes: minutes.toString() }));
                }
                return { ...prev, isRunning: !prev.isRunning };
              });
            }}
          >
            <Text className="text-white text-center font-semibold">{stopwatch.isRunning ? "Stop" : "Start"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-400 p-3 rounded flex-1"
            onPress={() => {
              setStopwatch({ isRunning: false, elapsed: 0 });
              setActivity((prev) => ({ ...prev, durationMinutes: "" }));
            }}
          >
            <Text className="text-white text-center font-semibold">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-red-600 p-1 rounded" onPress={() => setStopwatch((prev) => ({ ...prev, elapsed: Math.max(0, prev.elapsed - 60) }))}>
            <Text className="text-white text-center text-xl w-8"> - </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-green-600 p-1 rounded" onPress={() => setStopwatch((prev) => ({ ...prev, elapsed: prev.elapsed + 60 }))}>
            <Text className="text-white text-center text-xl w-8"> + </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Star Rating System */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1 text-center">Rating</Text>
        <View className="flex-row justify-between px-12">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setActivity((prev) => ({ ...prev, rating: star.toString() }))} className="mx-1">
              <Text className="text-4xl text-yellow-600 font-bold">{parseInt(activity.rating) >= star ? "★" : "☆"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Intensity Slider */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Intensity (1-10): {activity.intensity}</Text>
        {parseInt(activity.intensity) <= 3 ? (
          <Text className="text-green-600">Low intensity, can hold an entire conversation</Text>
        ) : parseInt(activity.intensity) <= 7 ? (
          <Text className="text-yellow-600">Moderate intensity, can still talk a little</Text>
        ) : (
          <Text className="text-red-600">High intensity, out of breath</Text>
        )}
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={parseInt(activity.intensity) || 1}
          onValueChange={(value) => setActivity((prev) => ({ ...prev, intensity: value.toString() }))}
          style={{ width: "100%", height: 40 }}
        />
      </View>

      {/* Calories Burned Output with Loader */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1">Calories Burned</Text>
        {calcLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <TextInput placeholder="-" value={activity.caloriesBurned} editable={false} className="rounded p-2" />
        )}
      </View>

      {/* Display Random Location */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1 text-center">Distance From Home (km)</Text>
        <Text className="text-center text-xl font-bold">{randomDistance}</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-green-600 p-3 rounded mb-2 ${!isFormValid ? "opacity-50" : ""}`}
        onPress={handleSubmit}
        disabled={!isFormValid || submitLoading}
      >
        {submitLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-center font-semibold">Add Exercise</Text>}
      </TouchableOpacity>

      <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
        <Text className="text-white text-center font-semibold">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddActivity;
