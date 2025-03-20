// RatingAndIntensity.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
import config from "../config";
import { router } from "expo-router";
import { useActivity } from "./ActivityContext";

const RatingAndIntensity: React.FC = () => {
  const { activity, setActivity } = useActivity();
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  // Generate random distance on mount if not already set.
  useEffect(() => {
    if (!activity.distanceFromHome) {
      const random = (Math.random() * (3 - 0.1) + 0.1).toFixed(1);
      setActivity((prev: any) => ({ ...prev, distanceFromHome: random }));
    }
  }, []);

  const handleCalculateCalories = async () => {
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
        setActivity((prev: any) => ({
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

  useEffect(() => {
    // Trigger calorie calculation on changes.
    const timer = setTimeout(() => {
      if (
        activity.exerciseType.trim() !== "" &&
        activity.durationMinutes.trim() !== "" &&
        !isNaN(parseInt(activity.durationMinutes)) &&
        parseInt(activity.durationMinutes) > 0
      ) {
        handleCalculateCalories();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [activity.exerciseType, activity.durationMinutes, activity.intensity]);

  const isFormValid =
    activity.exerciseType.trim() !== "" &&
    activity.durationMinutes.trim() !== "" &&
    activity.caloriesBurned.trim() !== "" &&
    activity.distanceFromHome.trim() !== "";

  const handleSubmit = async () => {
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
    <View className="flex-1 bg-gray-100">
      <ScrollView className="pt-16 p-6">
        <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">
          Rate & Set Intensity
        </Text>
        {message !== "" && (
          <Text className="text-center text-red-500 mb-4">{message}</Text>
        )}

        {/* Star Rating System */}
        <View className="mb-4">
          <Text className="text-gray-700 mb-1 text-center">Rating</Text>
          <View className="flex-row justify-between px-12">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() =>
                  setActivity((prev: any) => ({
                    ...prev,
                    rating: star.toString(),
                  }))
                }
                className="mx-1"
              >
                <Text className="text-4xl text-yellow-600 font-bold">
                  {parseInt(activity.rating) >= star ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensity Slider */}
        <View className="mb-3">
          <Text className="text-gray-700 mb-1">
            Intensity (1-10): {activity.intensity}
          </Text>
          {parseInt(activity.intensity) <= 3 ? (
            <Text className="text-green-600">
              Low intensity, can hold an entire conversation
            </Text>
          ) : parseInt(activity.intensity) <= 7 ? (
            <Text className="text-yellow-600">
              Moderate intensity, can still talk a little
            </Text>
          ) : (
            <Text className="text-red-600">High intensity, out of breath</Text>
          )}
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={parseInt(activity.intensity) || 1}
            onValueChange={(value) =>
              setActivity((prev: any) => ({ ...prev, intensity: value.toString() }))
            }
            style={{ width: "100%", height: 40 }}
          />
        </View>

        {/* Calories Burned Output */}
        <View className="mb-3">
          <Text className="text-gray-700 mb-1">Calories Burned</Text>
          {calcLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <TextInput
              placeholder="-"
              value={activity.caloriesBurned}
              editable={false}
              className="rounded p-2"
            />
          )}
        </View>

        {/* Display Random Distance */}
        <View className="mb-4">
          <Text className="text-gray-700 mb-1 text-center">
            Distance From Home (km)
          </Text>
          <Text className="text-center text-xl font-bold">
            {activity.distanceFromHome}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed buttons at the bottom */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between p-6 bg-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-gray-500 p-3 rounded flex-1 mr-2"
        >
          <Text className="text-white text-center font-semibold">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || submitLoading}
          className={`bg-green-600 p-3 rounded flex-1 ml-2 ${
            !isFormValid ? "opacity-50" : ""
          }`}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Add Exercise
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RatingAndIntensity;
