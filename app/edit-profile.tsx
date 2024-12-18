import { View, Text, TextInput, Button } from "react-native";

export default function EditProfile() {
  const updateProfile = async (profileDetails: Record<string, string>) => {
    try {
      const response = await fetch("https://your-api.com/edit-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileDetails),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Edit Profile</Text>
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Name"
      />
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Email"
      />
      <Button title="Save" onPress={() => updateProfile({ name: "John Updated", email: "john.new@example.com" })} />
    </View>
  );
}
