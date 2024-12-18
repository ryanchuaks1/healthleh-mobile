import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Profile</Text>
      <Button title="Edit Profile" onPress={() => router.push("/edit-profile")} />
    </View>
  );
}
