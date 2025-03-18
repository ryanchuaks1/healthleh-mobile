import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { View, Text, Image, Dimensions, TouchableOpacity } from "react-native";

interface ProfileSectionProps {
  healthData: {
    height: string;
    weight: string;
    weightGoal: string;
  };
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ healthData }) => {
  const { width } = Dimensions.get("window");

  return (
    <View className="mb-6">
      <View className="flex flex-row items-center relative">
        <View className="flex-1" />
        <Text className="text-3xl font-bold text-orange-800 text-center flex-1">Profile</Text>
        <View className="flex-1 flex items-end">
          <TouchableOpacity className="p-2 " onPress={() => router.push('/edit-profile')}>
            <Feather name="edit-2" color="gray" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex flex-row items-center justify-between mt-4">
        <View className="flex flex-col flex-1 items-center">
          <Text className="text-md md:text-xl text-orange-800">Current:</Text>
          <Text className="text-md md:text-xl text-gray-600">{healthData.height}</Text>
          <Text className="text-md md:text-xl text-gray-600">{healthData.weight}</Text>
        </View>
        <Image
          source={require("../assets/images/run.png")}
          style={{
            height: Math.min(width * 0.5, 400),
            width: Math.min(width * 0.5, 400),
            resizeMode: "contain",
          }}
        />
        <View className="flex flex-col flex-1 items-center">
          <Text className="text-md md:text-xl text-orange-800">Goal</Text>
          <Text className="text-md md:text-xl text-gray-600">{healthData.weightGoal} kg</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileSection;
