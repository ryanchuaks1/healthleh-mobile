import React from "react";
import { View, Text, Image, Dimensions } from "react-native";

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
      <Text className="text-3xl font-bold text-orange-800 text-center">Profile</Text>
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
          <Text className="text-md md:text-xl text-gray-600">{healthData.weightGoal}</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileSection;
