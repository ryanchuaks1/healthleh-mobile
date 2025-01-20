import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import config from "../config.js";

export default function GoalChartScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<{ id: string; GoalType: string; Goal: string }[]>([]);
  const [newGoalType, setNewGoalType] = useState("Weight");
  const [customGoalType, setCustomGoalType] = useState("");
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{
    [x: string]: any;
    id: string;
    GoalType: string;
    Goal: string;
  } | null>(null);
  const userPhoneNumber = "81228470";

  const displayMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/goals/${userPhoneNumber}`);
      if (response.ok) {
        const fetchedGoals = await response.json();
        setGoals(fetchedGoals);
      } else {
        displayMessage("Failed to fetch goals.");
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      displayMessage("Failed to fetch goals.");
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    const goalTypeToSend = isCustomGoal ? customGoalType : newGoalType;

    if (!goalTypeToSend || !newGoal) {
      displayMessage("Please provide both goal type and goal.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: userPhoneNumber,
          goalType: goalTypeToSend,
          goal: newGoal,
        }),
      });

      if (response.ok) {
        displayMessage("Goal added successfully!");
        setCustomGoalType("");
        setNewGoal("");
        setIsCustomGoal(false);
        await fetchGoals(); // Refresh the goals list
      } else {
        displayMessage("Failed to add goal.");
      }
    } catch (error) {
      console.error("Error adding goal:", error);
      displayMessage("Failed to add goal.");
    } finally {
      setLoading(false);
    }
  };

  const editGoal = async () => {
    if (!editingGoal) return;

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/goals/${editingGoal.Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: userPhoneNumber,
          goalType: editingGoal.GoalType,
          goal: editingGoal.Goal,
        }),
      });

      if (response.ok) {
        displayMessage("Goal updated successfully!");
        setEditModalVisible(false);
        setEditingGoal(null);
        await fetchGoals();
      } else {
        displayMessage("Failed to update goal.");
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      displayMessage("Failed to update goal.");
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (goal: { [x: string]: any; id: string; GoalType: string; Goal: string }) => {
    console.log("Deleting goal with ID:", goal.Id);
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/goals/${goal.Id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        displayMessage("Goal deleted successfully!");
        await fetchGoals(); // Refresh the goals list
      } else {
        displayMessage("Failed to delete goal.");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      displayMessage("Failed to delete goal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newGoalType === "Custom") {
      setIsCustomGoal(true);
    }
  }, [newGoalType]);

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-orange-800 text-center mb-6">Your Goals</Text>
      {message && <Text className="text-center text-red-500 mb-4">{message}</Text>}

      {goals.length > 0 ? (
        goals.map((goal, index) => (
          <View key={goal.id || `goal-${index}`} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <Text className="text-lg font-bold text-gray-800">{goal.GoalType}</Text>
            <Text className="text-md text-gray-600">{goal.Goal}</Text>
            <TouchableOpacity
              className="absolute top-2 right-2"
              onPress={() => {
                setEditingGoal(goal);
                setEditModalVisible(true);
              }}
            >
              <Text className="text-center text-white font-bold">✏️</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View className="bg-white p-4 rounded-lg shadow-md mb-6 items-center justify-center">
          <Text className="text-md font-semibold text-gray-600">
            {loading ? <ActivityIndicator size="large" color="#4CAF50" /> : `No goals found. Set your first goal below!`}
          </Text>
        </View>
      )}

      <View className="bg-white p-4 rounded-lg shadow-md mb-6">
        {!isCustomGoal ? (
          <Picker selectedValue={newGoalType} onValueChange={(itemValue) => setNewGoalType(itemValue)} style={{ height: 50, marginBottom: 20 }}>
            <Picker.Item label="Weight" value="Weight" />
            <Picker.Item label="Steps" value="Steps" />
            <Picker.Item label="Calories" value="Calories" />
            <Picker.Item label="Custom" value="Custom" />
          </Picker>
        ) : (
          <TextInput
            className="w-full bg-gray-100 p-4 rounded-lg mb-4"
            placeholder="Enter Custom Goal Type"
            value={customGoalType}
            onChangeText={setCustomGoalType}
          />
        )}

        <TextInput className="w-full bg-gray-100 p-4 rounded-lg mb-4" placeholder="Enter Goal" value={newGoal} onChangeText={setNewGoal} />

        <TouchableOpacity
          className="bg-orange-800 p-4 rounded-lg shadow-md mb-4"
          onPress={() => {
            addGoal();
          }}
        >
          <Text className="text-center text-white font-bold">{isCustomGoal ? "Save Custom Goal" : "Add Goal"}</Text>
        </TouchableOpacity>

        {isCustomGoal && (
          <TouchableOpacity
            className="bg-gray-400 p-4 rounded-lg"
            onPress={() => {
              setIsCustomGoal(false);
              setCustomGoalType("");
              setNewGoalType("Weight");
            }}
          >
            <Text className="text-center text-white font-bold">Cancel Custom Goal</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity className="w-full bg-slate-500 p-4 rounded-lg shadow-md mt-4" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to Home</Text>
      </TouchableOpacity>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-gray-900 bg-opacity-75 p-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-800 mb-4">Edit Goal</Text>
            <TextInput
              className="w-full bg-gray-100 p-4 rounded-lg mb-4"
              placeholder="Goal Type"
              value={editingGoal?.GoalType || ""}
              onChangeText={(text) => setEditingGoal((prev) => ({ ...prev, GoalType: text } as any))}
            />
            <TextInput
              className="w-full bg-gray-100 p-4 rounded-lg mb-4"
              placeholder="Goal"
              value={editingGoal?.Goal || ""}
              onChangeText={(text) => setEditingGoal((prev) => ({ ...prev, Goal: text } as any))}
            />
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity className="bg-gray-400 p-4 rounded-lg flex-1 mr-2" onPress={() => setEditModalVisible(false)}>
                <Text className="text-center text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-green-500 p-4 rounded-lg flex-1 ml-2" onPress={editGoal}>
                <Text className="text-center text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-lg mt-4"
              onPress={() => {
                if (editingGoal) {
                  deleteGoal(editingGoal);
                  setEditModalVisible(false);
                }
              }}
            >
              <Text className="text-center text-white font-bold">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
