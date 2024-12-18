import { View, Text, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";

export default function OTP() {
  const router = useRouter();
  const phone  = useSearchParams();

  const handleOTPVerification = async (otp: string) => {
    try {
      const response = await fetch("https://your-api.com/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/home");
      } else {
        alert("Invalid OTP.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Verify OTP</Text>
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Enter OTP"
        keyboardType="number-pad"
      />
      <Button title="Verify" onPress={() => handleOTPVerification("1234")} />
    </View>
  );
}
