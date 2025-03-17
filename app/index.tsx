import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import OTPInput from "../components/OTPInput";
import { registerForPushNotificationsAsync } from "./utils/notifications";

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isOtpVisible, setIsOtpVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const imageSize = Math.min(width * 0.7, 400);

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length !== 8 || isNaN(Number(phoneNumber))) {
      setMessage("Please enter a valid 8-digit phone number.");
      return;
    }
    setIsOtpVisible(true);
    setMessage("OTP Sent!");
  };

  const handleVerifyOtp = async () => {
    if (otp !== "1234") {
      setMessage("Invalid OTP. Please try again.");
      return;
    }
    setLoading(true);
    setMessage("Verifying OTP...");
    try {
      const url = `${config.API_BASE_URL}/api/users/${phoneNumber}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      setLoading(false);
      if (response.ok) {
        // Store the phone number as a session token
        await AsyncStorage.setItem("userPhoneNumber", phoneNumber);
        setMessage("Login successful!");

        // Register for push notifications (this returns a token/subscription)
        const pushTokenOrSubscription = await registerForPushNotificationsAsync();
        if (pushTokenOrSubscription) {
          // Send the token/subscription to your backend
          await fetch(`${config.API_BASE_URL}/api/registerPush`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pushToken: pushTokenOrSubscription,
              userId: phoneNumber,
              platform: Platform.OS, // "ios", "android", or "web"
            }),
          });
        }
        setTimeout(() => router.push("/home"), 1000);
      } else {
        if (response.status === 404) {
          setMessage("User not found. Redirecting to signup...");
        } else {
          setMessage(`Server error: ${response.statusText}`);
        }
        setTimeout(() => {
          router.push({ pathname: "/signup", params: { phoneNumber } });
        }, 1000);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error during login:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center px-6 pb-32">
      <Text className="text-3xl font-black text-orange-800">HealthLeh</Text>
      <Text className="text-lg mb-8">It's your health leh!</Text>
      <Image source={require("../assets/images/home.png")} style={{ height: imageSize, width: imageSize }} resizeMode="contain" />
      <Text className="text-2xl font-bold text-gray-800 my-2x">Welcome Back!</Text>
      {message !== "" && <Text className="text-md text-red-500 mb-4">{message}</Text>}
      {!isOtpVisible ? (
        <>
          <Text className="text-lg text-gray-600 mb-4 text-center">Enter your phone number to continue</Text>
          <TextInput
            className="w-full bg-white p-4 rounded-lg shadow-md mb-4 text-gray-800"
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity className="w-full bg-orange-400 p-4 rounded-lg shadow-md" onPress={handleSendOtp}>
            <Text className="text-center text-white font-bold">Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-lg text-gray-600 mb-4">Enter the OTP sent to your phone</Text>
          <OTPInput otp={otp} setOtp={setOtp} isDisabled={loading} />
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity className="w-full bg-green-500 p-4 rounded-lg shadow-md mt-4" onPress={handleVerifyOtp}>
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
};

export default Login;
