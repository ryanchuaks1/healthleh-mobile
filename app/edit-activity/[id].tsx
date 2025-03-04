import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
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

// Since only one dynamic segment exists, useLocalSearchParams might return a string.
// We check the type and assign accordingly.
const EditActivity: React.FC = () => {
  const params = useLocalSearchParams();
  // Determine if params is a string or an object.
  const id: string = typeof params === "string" ? params : (params as { id: string }).id;

  const [activity, setActivity] = useState({
    phoneNumber: "",
    exerciseType: "",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "",
    rating: "",
    distanceFromHome: "",
  });
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
      console.log(response);
      if (!response.ok) throw new Error("Failed to fetch activity details");
      const data: Activity = await response.json();
      setActivity({
        phoneNumber: data.phoneNumber || "",
        exerciseType: data.exerciseType || "",
        durationMinutes: data.durationMinutes?.toString() || "",
        caloriesBurned: data.caloriesBurned?.toString() || "",
        intensity: data.intensity?.toString() || "",
        rating: data.rating?.toString() || "",
        distanceFromHome: data.distanceFromHome?.toString() || "",
      });
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
        }, 1500);
      } else {
        displayMessage("Error updating activity.");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4 text-center">Edit Exercise</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Exercise Type</Text>
            <TextInput
              placeholder="Exercise Type"
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

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Calories Burned</Text>
            <TextInput
              placeholder="Calories Burned"
              value={activity.caloriesBurned}
              onChangeText={(text) => setActivity({ ...activity, caloriesBurned: text })}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Intensity (1-10)</Text>
            <TextInput
              placeholder="Intensity (1-10)"
              value={activity.intensity}
              onChangeText={(text) => setActivity({ ...activity, intensity: text })}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 mb-1">Rating (1-5)</Text>
            <TextInput
              placeholder="Rating (1-5)"
              value={activity.rating}
              onChangeText={(text) => setActivity({ ...activity, rating: text })}
              keyboardType="numeric"
              className="border border-gray-300 rounded p-2"
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

          <TouchableOpacity className="bg-gray-400 p-3 rounded" onPress={() => router.push("/activities")}>
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default EditActivity;
