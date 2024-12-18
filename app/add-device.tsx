import { View, Text, TextInput, Button } from "react-native";

export default function AddDevice() {
  const addDevice = async (deviceName: string) => {
    try {
      const response = await fetch("https://your-api.com/add-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceName }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-bold">Add Device</Text>
      <TextInput
        className="border rounded w-3/4 p-2 mb-4"
        placeholder="Device Name"
      />
      <Button title="Add" onPress={() => addDevice("My New Device")} />
    </View>
  );
}
