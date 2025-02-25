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
  exerciseDate: string; // new property for grouping
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
      }
    } catch (error: any) {
      displayMessage(`Error deleting activity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Group activities by exerciseDate
  const groupedActivities = activities.reduce((groups: { [key: string]: Activity[] }, activity) => {
    const date = activity.exerciseDate; // assume ISO or formatted string
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  const sections = Object.keys(groupedActivities).map((date) => ({
    title: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    data: groupedActivities[date],
  }));

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-4">User Exercise Logging</Text>
      {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      <TouchableOpacity className="bg-orange-800 p-3 rounded-lg shadow-md my-1" onPress={() => setModalVisible(true)}>
        <Text className="text-center text-white font-bold">Add Exercise</Text>
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section: { title } }) => <Text className="p-3 font-bold w-full text-center">{title}</Text>}
        renderItem={({ item }) => (
          <View className="border p-3 mb-2 rounded bg-orange-100 w-full">
            <Text className="font-bold">{item.exerciseType}</Text>
            <Text>Duration: {item.durationMinutes} mins</Text>
            <Text>Calories: {item.caloriesBurned}</Text>
            <Text>Intensity: {item.intensity}/10</Text>
            <Text>Rating: {item.rating}/5</Text>
            <View className="flex-row space-x-2 mt-2">
              <TouchableOpacity
                className="bg-blue-500 p-2 rounded flex-1"
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
                <Text className="text-white text-center">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-red-500 p-2 rounded flex-1" onPress={() => handleDelete(item.id)}>
                <Text className="text-white text-center">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
          <View className="bg-white w-11/12 p-6 rounded-lg">
            <Text className="text-2xl font-bold mb-4">{editingActivity ? "Edit Exercise" : "Add Exercise"}</Text>
            <TextInput placeholder="Exercise Type" value={exerciseType} onChangeText={setExerciseType} className="border p-2 mb-2" />
            <TextInput
              placeholder="Duration (minutes)"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
              className="border p-2 mb-2"
            />
            <TextInput
              placeholder="Calories Burned"
              value={caloriesBurned}
              onChangeText={setCaloriesBurned}
              keyboardType="numeric"
              className="border p-2 mb-2"
            />
            <TextInput placeholder="Intensity (1-10)" value={intensity} onChangeText={setIntensity} keyboardType="numeric" className="border p-2 mb-2" />
            <TextInput placeholder="Rating (1-5)" value={rating} onChangeText={setRating} keyboardType="numeric" className="border p-2 mb-2" />
            <TextInput
              placeholder="Distance From Home"
              value={distanceFromHome}
              onChangeText={setDistanceFromHome}
              keyboardType="numeric"
              className="border p-2 mb-4"
            />
            <TouchableOpacity className="bg-green-600 p-3 rounded mb-2" onPress={handleSubmit}>
              <Text className="text-white text-center">{editingActivity ? "Update Exercise" : "Add Exercise"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-400 p-3 rounded"
              onPress={() => {
                setModalVisible(false);
                setEditingActivity(null);
              }}
            >
              <Text className="text-white text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Activities;
