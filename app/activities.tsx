import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, SectionList, Modal } from "react-native";
import config from "../config";
import { router } from "expo-router";

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
  exerciseDate: string; // for grouping and timestamp
}

const Activities: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("81228470");
  const [exerciseType, setExerciseType] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("");
  const [intensity, setIntensity] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [distanceFromHome, setDistanceFromHome] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    if (phoneNumber) fetchActivities();
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

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    try {
      const url = editingActivity ? `${config.API_BASE_URL}/api/user-exercises/${editingActivity.id}` : `${config.API_BASE_URL}/api/user-exercises`;

      const response = await fetch(url, {
        method: editingActivity ? "PUT" : "POST",
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
        fetchActivities();
        displayMessage(editingActivity ? "Exercise updated successfully!" : "Exercise logged successfully!");
        setModalVisible(false);
        setEditingActivity(null);
        // Reset form fields
        setExerciseType("");
        setDurationMinutes("");
        setCaloriesBurned("");
        setIntensity("");
        setRating("");
        setDistanceFromHome("");
      } else {
        displayMessage("Error logging exercise");
      }
    } catch (error: any) {
      displayMessage(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/${id}`, { method: "DELETE" });
      if (!response.ok) {
        displayMessage("Error deleting activity");
      } else {
        fetchActivities();
        displayMessage("Exercise deleted successfully!");
        setModalVisible(false);
        setEditingActivity(null);
      }
    } catch (error: any) {
      displayMessage(`Error deleting activity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Group activities by date (ignoring time)
  const groupedActivities = activities.reduce((groups: { [key: string]: Activity[] }, activity) => {
    // Extract only the date portion in YYYY-MM-DD format
    const dateKey = new Date(activity.exerciseDate).toISOString().split("T")[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {});

  // Within each group, sort activities by exerciseDate descending
  for (const dateKey in groupedActivities) {
    groupedActivities[dateKey].sort((a, b) => new Date(b.exerciseDate).getTime() - new Date(a.exerciseDate).getTime());
  }
  // Sort the groups based on the latest activity timestamp in each group
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    const maxA = Math.max(...groupedActivities[a].map((act) => new Date(act.exerciseDate).getTime()));
    const maxB = Math.max(...groupedActivities[b].map((act) => new Date(act.exerciseDate).getTime()));
    return maxB - maxA;
  });

  const sections = sortedDates.map((dateKey) => ({
    title: new Date(dateKey).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    data: groupedActivities[dateKey],
  }));

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4">User Exercise Logging</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {/* Add Exercise Button */}
      <TouchableOpacity
        className="bg-orange-800 p-3 rounded-lg shadow-md my-1"
        onPress={() => {
          setEditingActivity(null);
          setModalVisible(true);
          // Reset form fields
          setExerciseType("");
          setDurationMinutes("");
          setCaloriesBurned("");
          setIntensity("");
          setRating("");
          setDistanceFromHome("");
        }}
      >
        <Text className="text-center text-white font-bold">Add Exercise</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#4CAF50" />}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section: { title } }) => (
          <View className="p-1 border-b border-gray-300 mb-2">
            <Text className="text-center text-gray-800 text-sm font-bold">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          // Extract the time portion (e.g., "22:40") from exerciseDate
          const time = new Date(item.exerciseDate).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <TouchableOpacity
              onPress={() => {
                setEditingActivity(item);
                setModalVisible(true);
                setExerciseType(item.exerciseType);
                setDurationMinutes(item.durationMinutes.toString());
                setCaloriesBurned(item.caloriesBurned.toString());
                setIntensity(item.intensity.toString());
                setRating(item.rating.toString());
                setDistanceFromHome(item.distanceFromHome.toString());
              }}
            >
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
                  <Text className="text-sm text-gray-700">
                    Distance: <Text className="font-medium">{item.distanceFromHome} km</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => !loading && <Text className="text-center text-gray-600">No activities found.</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingActivity(null);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-11/12 p-6 rounded-lg shadow-lg">
            <Text className="text-2xl font-bold mb-4 text-center">{editingActivity ? "Edit Exercise" : "Add Exercise"}</Text>

            <View className="mb-3">
              <Text className="text-gray-700 mb-1">Exercise Type</Text>
              <TextInput placeholder="Exercise Type" value={exerciseType} onChangeText={setExerciseType} className="border border-gray-300 rounded p-2" />
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
              <Text className="text-white text-center font-semibold">{editingActivity ? "Update Exercise" : "Add Exercise"}</Text>
            </TouchableOpacity>

            {editingActivity && (
              <TouchableOpacity className="bg-red-600 p-3 rounded mb-2" onPress={() => handleDelete(editingActivity.id)}>
                <Text className="text-white text-center font-semibold">Delete Exercise</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="bg-gray-400 p-3 rounded"
              onPress={() => {
                setModalVisible(false);
                setEditingActivity(null);
              }}
            >
              <Text className="text-white text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Activities;
