import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Home</Text>
      <Button title="Profile" onPress={() => router.push("/profile")} />
      <Button title="Add Device" onPress={() => router.push("/add-device")} />
    </View>
  );
}
