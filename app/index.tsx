import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const router = useRouter();
  const NODESERVER = process.env.NODESERVER;
  console.log("API Base URL:", NODESERVER);

  const handleSendOtp = () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
    // Simulate sending OTP
    setIsOtpVisible(true);
    Alert.alert("OTP Sent", "Your OTP is 1234.");
  };

  const handleVerifyOtp = async () => {
    if (otp !== "1234") {
      Alert.alert("Error", "Invalid OTP. Please try again.");
      return;
    }

    try {
      const response = await fetch(
        `https://${NODESERVER}/api/users/${phoneNumber}`
      );
      if (response.ok) {
        const user = await response.json();
        Alert.alert("Success", "Login successful!");
        router.push("/home"); // Navigate to Home if user exists
      } else {
        Alert.alert("Not Found", "User does not exist. Redirecting to signup.");
        router.push({
          pathname: "/signup",
          params: { phoneNumber },
        }); // Navigate to Signup if user doesn't exist
      }
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center p-6">
      <Text className="text-2xl font-bold mb-6">Login</Text>
      {!isOtpVisible ? (
        <>
          <TextInput
            className="w-full bg-white p-4 rounded-md mb-4"
            placeholder="Enter Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <Button title="Send OTP" onPress={handleSendOtp} />
        </>
      ) : (
        <>
          <TextInput
            className="w-full bg-white p-4 rounded-md mb-4"
            placeholder="Enter OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <Button title="Verify OTP" onPress={handleVerifyOtp} />
        </>
      )}
    </View>
  );
}
