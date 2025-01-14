import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import config from "../config.js";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState(""); // Input value for phone number
  const [otp, setOtp] = useState(""); // Input value for OTP
  const [isOtpVisible, setIsOtpVisible] = useState(false); // State to toggle OTP view
  const [loading, setLoading] = useState(false); // Loader state
  const [message, setMessage] = useState(""); // Feedback message state
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const imageSize = Math.min(width * 0.7, 400);

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length !== 8 || isNaN(Number(phoneNumber))) {
      setMessage("Please enter a valid 8-digit phone number.");
      return;
    }
    setIsOtpVisible(true);
    setMessage("OTP Sent: Your OTP is 1234.");
  };

  const handleVerifyOtp = async () => {
    if (otp !== "1234") {
      setMessage("Invalid OTP. Please try again.");
      return;
    }

    setLoading(true);
    setMessage("Verifying OTP...");
    try {
      console.log("API_BASE_URL:", config.API_BASE_URL);
      const url = `${config.API_BASE_URL}/api/users/${phoneNumber}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      setLoading(false); // Stop loader after receiving response
      if (response.ok) {
        const user = await response.json();
        console.log("Fetched user data:", user);
        setMessage("Login successful!");
        setTimeout(() => router.push("/home"), 1000);
      } else {
        console.warn("Fetch response status:", response.status, response.statusText);
        if (response.status === 404) {
          setMessage("User not found. Redirecting to signup...");
        } else {
          setMessage(`Server error: ${response.statusText}`);
        }
        setTimeout(
          () =>
            router.push({
              pathname: "/signup",
              params: { phoneNumber },
            }),
          1000
        );
      }
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        console.error("Error during login:", error.message);
      } else {
        console.error("Error during login:", error);
      }
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center px-6 pb-32">
      <Text className="text-3xl font-black text-orange-800">HealthLeh</Text>
      <Text className="text-lg mb-8">It's your health leh!</Text>
      <Image source={require("../assets/images/home.png")} style={{ height: imageSize, width: imageSize }} resizeMode="contain" />
      <Text className="text-2xl font-bold text-gray-800 my-2x">Welcome Back!</Text>
      {message && <Text className="text-md text-red-500 mb-4">{message}</Text>}
      {!isOtpVisible ? (
        <>
          <Text className="text-lg text-gray-600 mb-4 text-center">Enter your phone number to continue</Text>
          <TextInput
            className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
            }}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity className="w-full bg-orange-400 p-4 rounded-lg shadow-md" onPress={handleSendOtp}>
            <Text className="text-center text-white font-bold">Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-lg text-gray-600 mb-4">Enter the OTP sent to your phone</Text>
          <TextInput
            className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
            placeholder="Enter OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
            }}
            placeholderTextColor="#A0AEC0"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity className="w-full bg-green-500 p-4 rounded-lg shadow-md" onPress={handleVerifyOtp}>
              <Text className="text-center text-white font-bold">Verify OTP</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="w-full bg-red-600 p-4 rounded-lg shadow-md mt-4"
            onPress={() => {
              setIsOtpVisible(false);
              setOtp("");
              setMessage("");
            }}
          >
            <Text className="text-center text-white font-bold">Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
