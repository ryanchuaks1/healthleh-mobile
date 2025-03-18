import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

export default function Signup(): JSX.Element {
  const { phoneNumber } = useLocalSearchParams();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const router = useRouter();

  // Lookup the address using OpenCage API when postalCode has exactly 6 digits
  const handlePostalLookup = async (): Promise<void> => {
    if (!postalCode) {
      setMessageType("error");
      setMessage("Please enter a postal code.");
      return;
    }

    try {
      const apiKey = config.OPENCAGE_API_KEY;
      if (!apiKey) {
        setMessageType("error");
        setMessage("OpenCage API key is missing.");
        return;
      }

      // Append 'Singapore' to improve result accuracy
      const query = encodeURIComponent(`${postalCode} Singapore`);
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry;
        setLatitude(lat);
        setLongitude(lng);
        setStreetName(result.formatted || "Address not found");
        setMessageType("success");
        setMessage("Address found!");
      } else {
        setMessageType("error");
        setMessage("No location found for this postal code.");
      }
    } catch (error) {
      console.error("Error looking up postal code:", error);
      setMessageType("error");
      setMessage("An error occurred while looking up the postal code.");
    }
  };

  // Automatically trigger lookup when postal code reaches exactly 6 characters
  useEffect(() => {
    if (postalCode.length === 6) {
      handlePostalLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  // Handle signup submission and send new user details including long/lat and streetName
  const handleSignup = async (): Promise<void> => {
    if (!firstName || !lastName || !height || !weight || !postalCode) {
      setMessageType("error");
      setMessage("Please fill in all fields.");
      return;
    }

    if (latitude === null || longitude === null) {
      setMessageType("error");
      setMessage("Please lookup your postal code to determine your location.");
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
          latitude,
          longitude,
        }),
      });

      if (response.ok) {
        await AsyncStorage.setItem(
          "userPhoneNumber",
          Array.isArray(phoneNumber) ? phoneNumber[0] : phoneNumber
        );
        setMessageType("success");
        setMessage("User created successfully!");
        setTimeout(() => router.push("/home"), 1500);
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

        {message ? (
          <Text className={`text-md mb-4 ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </Text>
        ) : null}

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
          placeholder="Postal Code"
          keyboardType="numeric"
          value={postalCode}
          onChangeText={setPostalCode}
          placeholderTextColor="#A0AEC0"
        />

        {streetName ? (
          <Text className="mb-4 text-gray-700">Address: {streetName}</Text>
        ) : null}
        <TouchableOpacity
          className="w-full bg-orange-400 p-4 rounded-lg shadow-md"
          onPress={handleSignup}
        >
          <Text className="text-center text-white font-bold">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
