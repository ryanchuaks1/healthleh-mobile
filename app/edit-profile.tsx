import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

export default function EditProfile(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Fetch current profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const storedPhone = await AsyncStorage.getItem("userPhoneNumber");
      if (storedPhone) {
        setPhoneNumber(storedPhone);
        try {
          const response = await fetch(`${config.API_BASE_URL}/api/users/${storedPhone}`);
          if (response.ok) {
            const data = await response.json();
            setFirstName(data.FirstName || "");
            setLastName(data.LastName || "");
            setHeight(data.Height ? data.Height.toString() : "");
            setWeight(data.Weight ? data.Weight.toString() : "");
            // If your API returns postal code or location details, set them here.
            setLatitude(data.Latitude || null);
            setLongitude(data.Longitude || null);
          } else {
            setMessage("Failed to fetch profile.");
            setMessageType("error");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setMessage("An error occurred while fetching your profile.");
          setMessageType("error");
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Automatically trigger postal code lookup when exactly 6 digits are entered
  const handlePostalLookup = async (): Promise<void> => {
    if (postalCode.length !== 6) return;
    try {
      const apiKey = config.OPENCAGE_API_KEY;
      if (!apiKey) {
        setMessage("OpenCage API key is missing.");
        setMessageType("error");
        return;
      }
      const query = encodeURIComponent(`${postalCode} Singapore`);
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        setLatitude(result.geometry.lat);
        setLongitude(result.geometry.lng);
        setMessage("Location updated!");
        setMessageType("success");
      } else {
        setMessage("No location found for this postal code.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error looking up postal code:", error);
      setMessage("An error occurred while looking up the postal code.");
      setMessageType("error");
    }
  };

  useEffect(() => {
    if (postalCode.length === 6) {
      handlePostalLookup();
    }
  }, [postalCode]);

  // Handle profile update
  const handleUpdateProfile = async (): Promise<void> => {
    if (!firstName || !lastName || !height || !weight) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }
    if (latitude === null || longitude === null) {
      setMessage("Please enter a valid 6-digit postal code to update your location.");
      setMessageType("error");
      return;
    }
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/users/${phoneNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          height: parseFloat(height),
          weight: parseFloat(weight),
          latitude,
          longitude,
          // streetName is removed from the flow.
        }),
      });
      if (response.ok) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
        setTimeout(() => router.push("/home"), 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || "Failed to update profile.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("An error occurred while updating profile.");
      setMessageType("error");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6 pt-16">
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <View>
          <Text className="text-3xl font-bold text-gray-800 mb-6">Edit Profile</Text>
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
          <TouchableOpacity
            className="w-full bg-blue-500 p-4 rounded-lg mb-4"
            onPress={handleUpdateProfile}
          >
            <Text className="text-center text-white font-bold">Save Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full bg-gray-500 p-4 rounded-lg"
            onPress={() => router.push("/home")}
          >
            <Text className="text-center text-white font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
