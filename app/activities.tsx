import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Modal } from 'react-native';
import config from "../config.js";
import { router } from "expo-router";

const Activities = () => {
  const [phoneNumber, setPhoneNumber] = useState("81228470");
  const [exerciseType, setExerciseType] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [intensity, setIntensity] = useState('');
  const [rating, setRating] = useState('');
  const [distanceFromHome, setDistanceFromHome] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  interface Activity {
    id: number;
    exerciseType: string;
    durationMinutes: number;
    caloriesBurned: number;
    intensity: number;
    rating: number;
    distanceFromHome: number;
  }

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const displayMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    if (phoneNumber) fetchActivities();
  }, [phoneNumber]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user-exercises/${phoneNumber}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      if (data.length === 0) {
        displayMessage("No activities found.");
      }
      setActivities(data);
    } catch (error) {
      displayMessage(`Error fetching activities: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = editingActivity 
        ? `${config.API_BASE_URL}/api/user-exercises/${editingActivity.id}` 
        : `${config.API_BASE_URL}/api/user-exercises`;
      
      const response = await fetch(url, {
        method: editingActivity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          exerciseType,
          durationMinutes: parseInt(durationMinutes),
          caloriesBurned: parseInt(caloriesBurned),
          intensity: parseInt(intensity),
          rating: parseInt(rating),
          distanceFromHome: parseFloat(distanceFromHome)
        })
      });

      if (response.ok) {
        fetchActivities();
        displayMessage(editingActivity ? 'Exercise updated successfully!' : 'Exercise logged successfully!');
        setModalVisible(false);
        setEditingActivity(null);
      } else {
        displayMessage(`Error logging exercise`);
      }
    } catch (error) {
      displayMessage(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    setLoading(true);
    try {
      await fetch(`${config.API_BASE_URL}/api/user-exercises/${id}`, { method: 'DELETE' });
      fetchActivities();
    } catch (error) {
      displayMessage(`Error deleting activity: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 mb-6">User Exercise Logging</Text>
      {message && <Text className="text-center text-red-500 mb-4">{message}</Text>}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      <TouchableOpacity className="bg-orange-800 p-4 rounded-lg shadow-md mt-4" onPress={() => setModalVisible(true)}>
        <Text className="text-center text-white font-bold">Add Exercise</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold text-orange-800 mt-5">Past Activities</Text>
      {activities.length === 0 && !loading && (
        <Text className="text-center text-gray-600">No activities found.</Text>
      )}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border p-3 my-2 rounded bg-orange-100">
            <Text className="font-bold">{item.exerciseType}</Text>
            <Text>Duration: {item.durationMinutes} mins</Text>
            <Text>Calories: {item.caloriesBurned}</Text>
            <Text>Intensity: {item.intensity}/10</Text>
            <Text>Rating: {item.rating}/5</Text>
            <TouchableOpacity className="bg-blue-500 p-2 rounded mt-2" onPress={() => {
              setEditingActivity(item);
              setModalVisible(true);
              setExerciseType(item.exerciseType);
              setDurationMinutes(item.durationMinutes.toString());
              setCaloriesBurned(item.caloriesBurned.toString());
              setIntensity(item.intensity.toString());
              setRating(item.rating.toString());
              setDistanceFromHome(item.distanceFromHome.toString());
            }}>
              <Text className="text-white text-center">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-red-500 p-2 rounded mt-2" onPress={() => handleDelete(item.id)}>
              <Text className="text-white text-center">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );
};

export default Activities;
