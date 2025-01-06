import { View, Text, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const handleLogin = async (phoneNumber: string) => {
    try {
      const response = await fetch("https://your-api.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/otp?phone=${phoneNumber}`);
      } else {
        alert("User not found. Redirecting to signup.");
        router.push("/signup");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Login</Text>
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Enter Phone Number"
        keyboardType="phone-pad"
      />
      <Button title="Next" onPress={() => handleLogin("12345678")} />
    </View>
  );
}
