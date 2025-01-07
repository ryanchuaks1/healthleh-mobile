import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter, useSearchParams } from "expo-router";

export default function Signup() {
  const { phoneNumber } = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [weightGoal, setWeightGoal] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      const response = await fetch("https://your-api-url.com/api/users", {
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
        Alert.alert("Success", "User created successfully!");
        router.push("/home");
      } else {
        Alert.alert("Error", "Failed to create user. Please try again.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center p-6">
      <Text className="text-2xl font-bold mb-6">Signup</Text>
      <TextInput
        className="w-full bg-white p-4 rounded-md mb-4"
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        className="w-full bg-white p-4 rounded-md mb-4"
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        className="w-full bg-white p-4 rounded-md mb-4"
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        className="w-full bg-white p-4 rounded-md mb-4"
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      <TextInput
        className="w-full bg-white p-4 rounded-md mb-4"
        placeholder="Weight Goal (kg)"
        keyboardType="numeric"
        value={weightGoal}
        onChangeText={setWeightGoal}
      />
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}
