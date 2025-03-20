import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useActivity } from "./ActivityContext";

const TimerScreen: React.FC = () => {
  const { activity, setActivity } = useActivity();
  const [stopwatch, setStopwatch] = useState({ isRunning: false, elapsed: 0 });
  const [message, setMessage] = useState<string>("");

  const displayMessage = (text: string): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stopwatch.isRunning) {
      interval = setInterval(() => {
        setStopwatch((prev) => ({ ...prev, elapsed: prev.elapsed + 1 }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatch.isRunning]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleStopwatch = () => {
    setStopwatch((prev) => {
      if (prev.isRunning) {
        const minutes = Math.max(1, Math.round(prev.elapsed / 60));
        setActivity((a) => ({ ...a, durationMinutes: minutes.toString() }));
      }
      return { ...prev, isRunning: !prev.isRunning };
    });
  };

  const handleReset = () => {
    setStopwatch({ isRunning: false, elapsed: 0 });
    setActivity((prev) => ({ ...prev, durationMinutes: "" }));
  };

  const handleDecrement = () => {
    setStopwatch((prev) => ({ ...prev, elapsed: Math.max(0, prev.elapsed - 60) }));
  };

  const handleIncrement = () => {
    setStopwatch((prev) => ({ ...prev, elapsed: prev.elapsed + 60 }));
  };

  const handleNext = () => {
    if (!activity.durationMinutes || parseInt(activity.durationMinutes) <= 0) {
      displayMessage("Please record a valid duration.");
      return;
    }
    router.push("/rating-intensity");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-100 p-6">
      <View>
        <Text className="text-3xl font-bold text-orange-800 mb-2 text-center pt-16">Timer</Text>
        <Text className="text-lg text-gray-700 mb-4 text-center">
          Exercise: {activity.exerciseType || "Not selected"}
        </Text>
        {message !== "" && <Text className="text-center text-red-500 mb-4">{message}</Text>}
        <View className="w-full items-center mb-4">
          <Text className="text-4xl font-bold mb-2">{formatTime(stopwatch.elapsed)}</Text>
        </View>
        <View className="flex-row justify-center space-x-3 mb-4">
          <TouchableOpacity onPress={handleToggleStopwatch} className="bg-blue-600 p-3 rounded flex-1">
            <Text className="text-white text-center font-semibold">
              {stopwatch.isRunning ? "Stop" : "Start"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} className="bg-gray-400 p-3 rounded flex-1">
            <Text className="text-white text-center font-semibold">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDecrement} className="bg-red-600 p-1 rounded">
            <Text className="text-white text-center text-xl w-8"> - </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleIncrement} className="bg-green-600 p-1 rounded">
            <Text className="text-white text-center text-xl w-8"> + </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-row justify-between mt-auto">
        <TouchableOpacity onPress={handleBack} className="bg-gray-500 p-3 rounded flex-1 mr-2">
          <Text className="text-white text-center font-semibold">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} className="bg-green-600 p-3 rounded flex-1 ml-2">
          <Text className="text-white text-center font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TimerScreen;
