import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

export default function Signup() {
  const { phoneNumber } = useLocalSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [weightGoal, setWeightGoal] = useState("");
  const [message, setMessage] = useState(""); // Feedback message
  const [messageType, setMessageType] = useState("success"); // Message type (success/error)
  const router = useRouter();

  const handleSignup = async () => {
    if (!firstName || !lastName || !height || !weight || !weightGoal) {
      setMessageType("error");
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          firstName,
          lastName,
          height: parseFloat(height),
          weight: parseFloat(weight),
          weightGoal: parseFloat(weightGoal),
        }),
      });

      if (response.ok) {
        // Store phone number in AsyncStorage as session token
        await AsyncStorage.setItem("userPhoneNumber", Array.isArray(phoneNumber) ? phoneNumber[0] : phoneNumber);
        setMessageType("success");
        setMessage("User created successfully!");
        setTimeout(() => router.push("/home"), 1500); // Redirect to home after a delay
      } else {
        const errorData = await response.json();
        console.error("Signup Error:", errorData);
        setMessageType("error");
        setMessage(errorData.message || "Failed to create user.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setMessageType("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 px-6">
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-3xl font-bold text-gray-800 mb-6">Complete Your Signup</Text>
        <Text className="text-lg text-gray-600 mb-4">
          Phone Number: <Text className="font-bold text-gray-800">{phoneNumber}</Text>
        </Text>

        {/* Feedback Message */}
        {message ? <Text className={`text-md mb-4 ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>{message}</Text> : null}

        {/* Signup Form */}
        <TextInput
          className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
          placeholder="Height (cm)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
          placeholder="Weight (kg)"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
          placeholder="Weight Goal (kg)"
          keyboardType="numeric"
          value={weightGoal}
          onChangeText={setWeightGoal}
          placeholderTextColor="#A0AEC0"
        />
        <TouchableOpacity className="w-full bg-orange-400 p-4 rounded-lg shadow-md" onPress={handleSignup}>
          <Text className="text-center text-white font-bold">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
