import { View, Text, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Signup() {
  const router = useRouter();

  const handleSignup = async (userDetails: Record<string, string>) => {
    try {
      const response = await fetch("https://your-api.com/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDetails),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/home");
      } else {
        alert("Signup failed.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Sign Up</Text>
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Name"
      />
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />
      <Button title="Sign Up" onPress={() => handleSignup({ name: "John", email: "john@example.com", phone: "12345678" })} />
    </View>
  );
}
